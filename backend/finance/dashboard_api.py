# backend/finance/api_dashboard.py
import io
import csv
import base64
from datetime import date, timedelta, datetime
from decimal import Decimal
from typing import Optional
from collections import OrderedDict

from django.http import HttpResponse
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.core.cache import cache
from django.conf import settings
from django.db.models import Sum
from django.db.models.functions import TruncDay, TruncMonth

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from users.models import Business
from core.permissions import IsBusinessMember
from finance.models import Expense, Income, Category

from notifications.utils import register_dashboard_cache_key

# PDF libs
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

CACHE_TTL = getattr(settings, "FINANCE_DASHBOARD_CACHE_TTL", 60)  # seconds — adjust as needed


def _to_float_safe(v):
    if v is None:
        return 0.0
    if isinstance(v, Decimal):
        return float(v)
    try:
        return float(v)
    except Exception:
        return 0.0


def _date_range_default():
    today = timezone.localdate()
    start = today - timedelta(days=30)
    return start, today


def get_analytics_data(business, start_date: Optional[date] = None, end_date: Optional[date] = None, period: str = "auto"):
    """
    Returns aggregated analytics payload for a given business and optional date range.
    This mirrors earlier inline logic but is factored out for reuse by GET and export endpoints.
    """

    # Defaults
    if not start_date or not end_date:
        start_date, end_date = _date_range_default()

    # Querysets (only non-deleted)
    expense_qs = Expense.objects.filter(business=business, is_deleted=False, date__gte=start_date, date__lte=end_date)
    income_qs = Income.objects.filter(business=business, is_deleted=False, date__gte=start_date, date__lte=end_date)

    # Summary totals
    total_expense = expense_qs.aggregate(total=Sum("amount"))["total"] or Decimal("0")
    total_income = income_qs.aggregate(total=Sum("amount"))["total"] or Decimal("0")
    net = total_income - total_expense
    profit_margin = None
    if total_income and total_income != 0:
        profit_margin = float(net / total_income * 100)

    summary = {
        "total_income": _to_float_safe(total_income),
        "total_expense": _to_float_safe(total_expense),
        "net": _to_float_safe(net),
        "profit_margin_percent": profit_margin,
    }

    # Daily series map (fill gaps)
    daily_map = OrderedDict()
    cur = start_date
    while cur <= end_date:
        key = cur.isoformat()
        daily_map[key] = {"date": key, "income": 0.0, "expense": 0.0}
        cur = cur + timedelta(days=1)

    daily_inc = income_qs.annotate(day=TruncDay("date")).values("day").annotate(total=Sum("amount")).order_by("day")
    daily_exp = expense_qs.annotate(day=TruncDay("date")).values("day").annotate(total=Sum("amount")).order_by("day")

    for r in daily_inc:
        d = r["day"].date().isoformat() if hasattr(r["day"], "date") else r["day"].isoformat()
        if d in daily_map:
            daily_map[d]["income"] = _to_float_safe(r["total"])

    for r in daily_exp:
        d = r["day"].date().isoformat() if hasattr(r["day"], "date") else r["day"].isoformat()
        if d in daily_map:
            daily_map[d]["expense"] = _to_float_safe(r["total"])

    cash_flow_daily = list(daily_map.values())

    # Monthly series
    cash_flow_monthly = []
    if period == "monthly" or (end_date - start_date).days > 90 or period == "auto":
        # Build month buckets from start month to end month
        monthly_inc = income_qs.annotate(month=TruncMonth("date")).values("month").annotate(total=Sum("amount")).order_by("month")
        monthly_exp = expense_qs.annotate(month=TruncMonth("date")).values("month").annotate(total=Sum("amount")).order_by("month")

        months = OrderedDict()
        # Start at first day of start_date's month
        m = start_date.replace(day=1)
        while m <= end_date:
            key = m.strftime("%Y-%m")
            months[key] = {"month": key, "income": 0.0, "expense": 0.0}
            # advance month
            if m.month == 12:
                m = m.replace(year=m.year + 1, month=1)
            else:
                m = m.replace(month=m.month + 1)

        for r in monthly_inc:
            # r["month"] is a datetime/date representing month
            key = r["month"].strftime("%Y-%m")
            if key in months:
                months[key]["income"] = _to_float_safe(r["total"])
        for r in monthly_exp:
            key = r["month"].strftime("%Y-%m")
            if key in months:
                months[key]["expense"] = _to_float_safe(r["total"])

        cash_flow_monthly = list(months.values())

    # Top categories (expenses)
    top_cats_qs = expense_qs.values("category__id", "category__name").annotate(total=Sum("amount")).order_by("-total")[:5]
    top_categories = [
        {"category_id": r["category__id"], "name": r["category__name"] or "Uncategorized", "total": _to_float_safe(r["total"])}
        for r in top_cats_qs
    ]

    # Top income categories
    top_cats_income_qs = income_qs.values("category__id", "category__name").annotate(total=Sum("amount")).order_by("-total")[:5]
    top_income_categories = [
        {"category_id": r["category__id"], "name": r["category__name"] or "Uncategorized", "total": _to_float_safe(r["total"])}
        for r in top_cats_income_qs
    ]

    # Month-over-month growth (net)
    mom_growth = None
    if len(cash_flow_monthly) >= 2:
        last = cash_flow_monthly[-1]
        prev = cash_flow_monthly[-2]
        last_net = last["income"] - last["expense"]
        prev_net = prev["income"] - prev["expense"]
        if prev_net != 0:
            mom_growth = (last_net - prev_net) / abs(prev_net) * 100

    # Recent transactions (merge top 20 recent by date/created_at)
    exs = list(expense_qs.order_by("-date", "-created_at")[:20])
    incs = list(income_qs.order_by("-date", "-created_at")[:20])

    merged = []
    for e in exs:
        merged.append({
            "type": "expense",
            "id": e.id,
            "amount": _to_float_safe(e.amount),
            "date": e.date.isoformat() if e.date else None,
            "description": e.description,
            "category": getattr(e.category, "name", None) or "Uncategorized",
            "created_by": getattr(e.created_by, "email", None),
            "created_at": e.created_at.isoformat() if getattr(e, "created_at", None) else None,
        })
    for i in incs:
        merged.append({
            "type": "income",
            "id": i.id,
            "amount": _to_float_safe(i.amount),
            "date": i.date.isoformat() if i.date else None,
            "description": i.description,
            "category": getattr(i.category, "name", None) or "Uncategorized",
            "created_by": getattr(i.created_by, "email", None),
            "created_at": i.created_at.isoformat() if getattr(i, "created_at", None) else None,
        })

    # sort merged by date (ISO strings sortable) then created_at as fallback
    merged_sorted = sorted(
        merged,
        key=lambda x: (x.get("date") or "", x.get("created_at") or ""),
        reverse=True
    )[:20]

    payload = {
        "summary": summary,
        "cash_flow": {"daily": cash_flow_daily, "monthly": cash_flow_monthly},
        "top_categories": top_categories,
        "top_income_categories": top_income_categories,
        "month_over_month_growth_percent": mom_growth,
        "recent_transactions": merged_sorted,
        "generated_at": timezone.now().isoformat(),
    }

    return payload


class FinanceDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated, IsBusinessMember]

    def get_business(self, request):
        # user belongs to exactly one business per your assumption
        return request.user.business

    def get(self, request, *args, **kwargs):
        business = self.get_business(request)

        # parse optional date filters from query params
        s = request.query_params.get("start_date")
        e = request.query_params.get("end_date")
        period = request.query_params.get("period", "auto")  # auto/daily/monthly

        if s and e:
            try:
                start_date = date.fromisoformat(s)
                end_date = date.fromisoformat(e)
            except Exception:
                return Response({"detail": "invalid date format, use YYYY-MM-DD"}, status=400)
        else:
            start_date, end_date = _date_range_default()

        cache_key = f"finance_dashboard:{business.id}:{start_date}:{end_date}:{period}"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        payload = get_analytics_data(business, start_date=start_date, end_date=end_date, period=period)

        # cache & register key for invalidation
        cache.set(cache_key, payload, CACHE_TTL)
        try:
            register_dashboard_cache_key(business.id, cache_key)
        except Exception:
            # non-fatal
            pass

        return Response(payload)


class FinanceExportCSVView(APIView):
    permission_classes = [IsAuthenticated, IsBusinessMember]

    def post(self, request):
        """
        POST /api/finance/analytics/export/csv/
        Optional JSON body: date_from, date_to
        Returns CSV file of matching recent transactions (bounded at 500 entries)
        """
        user = request.user
        business = user.business

        date_from = request.data.get("date_from")
        date_to = request.data.get("date_to")
        dt_from = parse_date(date_from) if date_from else None
        dt_to = parse_date(date_to) if date_to else None

        exp_qs = Expense.objects.filter(business=business, is_deleted=False)
        inc_qs = Income.objects.filter(business=business, is_deleted=False)
        if dt_from:
            exp_qs = exp_qs.filter(date__gte=dt_from)
            inc_qs = inc_qs.filter(date__gte=dt_from)
        if dt_to:
            exp_qs = exp_qs.filter(date__lte=dt_to)
            inc_qs = inc_qs.filter(date__lte=dt_to)

        rows = []
        # cap to 500 each for safety
        for e in exp_qs.order_by("-created_at").values("id", "amount", "category__name", "date", "description", "created_by__email", "created_at")[:500]:
            rows.append({
                "id": e["id"],
                "type": "expense",
                "amount": str(e["amount"]),
                "category": e["category__name"] or "Uncategorized",
                "date": e["date"].isoformat() if e["date"] else "",
                "description": e["description"] or "",
                "created_by": e["created_by__email"] or "",
                "created_at": e["created_at"].isoformat() if e["created_at"] else ""
            })
        for i in inc_qs.order_by("-created_at").values("id", "amount", "category__name", "date", "description", "created_by__email", "created_at")[:500]:
            rows.append({
                "id": i["id"],
                "type": "income",
                "amount": str(i["amount"]),
                "category": i["category__name"] or "Uncategorized",
                "date": i["date"].isoformat() if i["date"] else "",
                "description": i["description"] or "",
                "created_by": i["created_by__email"] or "",
                "created_at": i["created_at"].isoformat() if i["created_at"] else ""
            })

        # write CSV
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=["id", "type", "amount", "category", "date", "description", "created_by", "created_at"])
        writer.writeheader()
        for r in rows:
            writer.writerow(r)

        resp = HttpResponse(output.getvalue(), content_type="text/csv")
        resp["Content-Disposition"] = f'attachment; filename="analytics_{business.id}_{datetime.utcnow().strftime("%Y%m%d%H%M%S")}.csv"'
        return resp


class FinanceExportPDFView(APIView):
    permission_classes = [IsAuthenticated, IsBusinessMember]

    def post(self, request):
        """
        POST /api/finance/analytics/export/pdf/
        Body:
        {
          "charts": { "cashFlow": "data:image/png;base64,...", "topExpenses": "...", "topIncomes": "..." },
          "date_from": "YYYY-MM-DD", "date_to": "YYYY-MM-DD"
        }
        """
        user = request.user
        business = user.business

        charts = request.data.get("charts", {}) or {}
        date_from = request.data.get("date_from")
        date_to = request.data.get("date_to")

        # Parse dates
        dt_from = parse_date(date_from) if date_from else None
        dt_to = parse_date(date_to) if date_to else None

        # Reuse analytics helper to fetch consistent payload
        start_date = dt_from or _date_range_default()[0]
        end_date = dt_to or _date_range_default()[1]
        analytics_data = get_analytics_data(business, start_date=start_date, end_date=end_date, period="auto")

        # Build PDF
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        # Header
        p.setFont("Helvetica-Bold", 16)
        p.drawString(40, height - 50, f"{business.name} — Analytics")
        p.setFont("Helvetica", 10)
        p.drawString(40, height - 70, f"Range: {date_from or start_date.isoformat()} → {date_to or end_date.isoformat()}")
        p.drawString(40, height - 85, f"Generated: {datetime.utcnow().isoformat()} UTC")

        # KPI summary (from analytics_data['summary'])
        kp = analytics_data.get("summary", {})
        p.setFont("Helvetica-Bold", 12)
        p.drawString(40, height - 110, "Summary")
        p.setFont("Helvetica", 10)
        income_val = kp.get("total_income", 0.0)
        expense_val = kp.get("total_expense", 0.0)
        net_val = kp.get("net", 0.0)
        margin_val = kp.get("profit_margin_percent", None)
        p.drawString(40, height - 125, f"Income: {income_val}")
        p.drawString(160, height - 125, f"Expense: {expense_val}")
        p.drawString(300, height - 125, f"Net: {net_val}")
        p.drawString(420, height - 125, f"Margin: {margin_val if margin_val is not None else 'N/A'}%")

        # Embed charts (if provided)
        y = height - 170
        # Accept either CamelCase keys or lowercase keys to be forgiving
        for key in ("cashFlow", "topExpenses", "topIncomes", "cashflow", "topexpenses", "topincomes"):
            img_b64 = charts.get(key)
            if not img_b64:
                continue
            # remove data url header if present
            if isinstance(img_b64, str) and img_b64.startswith("data:"):
                try:
                    header, img_b64 = img_b64.split(",", 1)
                except ValueError:
                    continue
            if not img_b64:
                continue
            try:
                img_data = base64.b64decode(img_b64)
                img = ImageReader(io.BytesIO(img_data))
                max_w = width - 80
                max_h = 180
                # drawImage(y coordinate uses bottom-left)
                p.drawImage(img, 40, y - max_h, width=max_w, height=max_h, preserveAspectRatio=True, anchor='sw')
                y -= (max_h + 20)
                if y < 120:
                    p.showPage()
                    y = height - 40
            except Exception:
                # skip any invalid image data
                continue

        # Recent tx table on a new page
        p.showPage()
        p.setFont("Helvetica-Bold", 12)
        p.drawString(40, height - 50, "Recent Transactions")
        p.setFont("Helvetica", 9)
        y = height - 70
        rows = analytics_data.get("recent_transactions", [])
        for r in rows:
            created_at = r.get("created_at") or r.get("date") or ""
            line = f"{(created_at[:19] if created_at else '')} | {r.get('type','')} | {r.get('category','')} | {r.get('amount','')} | { (r.get('description') or '')[:80]}"
            p.drawString(40, y, line)
            y -= 14
            if y < 40:
                p.showPage()
                y = height - 40

        p.save()
        buffer.seek(0)
        resp = HttpResponse(buffer.getvalue(), content_type="application/pdf")
        resp["Content-Disposition"] = f'attachment; filename="analytics_{business.id}_{datetime.utcnow().strftime("%Y%m%d%H%M%S")}.pdf"'
        return resp
