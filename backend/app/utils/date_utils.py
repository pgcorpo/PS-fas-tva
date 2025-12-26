from datetime import date, datetime, timedelta
from typing import Tuple
import pytz


def get_week_start(d: date) -> date:
    """
    Get the Monday of the week containing the given date.
    Week starts on Monday.
    """
    # Monday is 0, so we subtract the weekday to get to Monday
    days_since_monday = d.weekday()
    return d - timedelta(days=days_since_monday)


def get_week_end(d: date) -> date:
    """
    Get the Sunday of the week containing the given date.
    Week ends on Sunday.
    """
    week_start = get_week_start(d)
    return week_start + timedelta(days=6)


def get_week_range(d: date) -> Tuple[date, date]:
    """
    Get the week start (Monday) and end (Sunday) for a given date.
    Returns (week_start, week_end).
    """
    week_start = get_week_start(d)
    week_end = get_week_end(d)
    return (week_start, week_end)


def get_next_monday(d: date) -> date:
    """
    Get the next Monday after the given date.
    If the date is already a Monday, returns the following Monday.
    """
    week_start = get_week_start(d)
    if d == week_start:
        # If it's already Monday, return next Monday
        return week_start + timedelta(days=7)
    else:
        # Return the Monday of next week
        return week_start + timedelta(days=7)


def validate_today(
    claimed_date: str,
    client_timezone: str | None = None,
    client_tz_offset_minutes: int | None = None,
) -> bool:
    """
    Validate that the claimed date matches the client's actual "today"
    based on their timezone.
    
    Args:
        claimed_date: Date string in YYYY-MM-DD format
        client_timezone: IANA timezone string (e.g., "America/New_York")
        client_tz_offset_minutes: UTC offset in minutes (alternative to timezone)
    
    Returns:
        True if the claimed date matches the client's today, False otherwise
    """
    try:
        claimed = date.fromisoformat(claimed_date)
    except ValueError:
        return False
    
    # Get current UTC time
    now_utc = datetime.utcnow()
    
    # Determine client's timezone
    if client_timezone:
        try:
            tz = pytz.timezone(client_timezone)
            now_client = now_utc.replace(tzinfo=pytz.UTC).astimezone(tz)
            client_today = now_client.date()
        except pytz.exceptions.UnknownTimeZoneError:
            return False
    elif client_tz_offset_minutes is not None:
        # Use offset to calculate client's today
        offset = timedelta(minutes=client_tz_offset_minutes)
        now_client = now_utc + offset
        client_today = now_client.date()
    else:
        # No timezone info provided, cannot validate
        return False
    
    return claimed == client_today
