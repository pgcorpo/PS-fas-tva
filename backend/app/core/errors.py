from fastapi import HTTPException, status


class APIError(HTTPException):
    """Base class for API errors with canonical error codes"""
    
    def __init__(self, error_code: str, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.error_code = error_code
        super().__init__(
            status_code=status_code,
            detail={
                "errorCode": error_code,
                "message": message
            }
        )


# Canonical error codes as per spec
class UnauthorizedError(APIError):
    def __init__(self, message: str = "Authentication required"):
        super().__init__("UNAUTHORIZED", message, status.HTTP_401_UNAUTHORIZED)


class ForbiddenError(APIError):
    def __init__(self, message: str = "Access forbidden"):
        super().__init__("FORBIDDEN", message, status.HTTP_403_FORBIDDEN)


class ValidationError(APIError):
    def __init__(self, message: str = "Validation error"):
        super().__init__("VALIDATION_ERROR", message, status.HTTP_400_BAD_REQUEST)


class InvalidDateError(APIError):
    def __init__(self, message: str = "Invalid date"):
        super().__init__("INVALID_DATE", message, status.HTTP_400_BAD_REQUEST)


class PastDateReadonlyError(APIError):
    def __init__(self, message: str = "Past dates are read-only"):
        super().__init__("PAST_DATE_READONLY", message, status.HTTP_400_BAD_REQUEST)


class HabitNotFoundError(APIError):
    def __init__(self, message: str = "Habit not found"):
        super().__init__("HABIT_NOT_FOUND", message, status.HTTP_404_NOT_FOUND)


class HabitDeletedError(APIError):
    def __init__(self, message: str = "Habit has been deleted"):
        super().__init__("HABIT_DELETED", message, status.HTTP_400_BAD_REQUEST)


class HabitNotActiveForWeekError(APIError):
    def __init__(self, message: str = "Habit is not active for this week"):
        super().__init__("HABIT_NOT_ACTIVE_FOR_WEEK", message, status.HTTP_400_BAD_REQUEST)


class WeeklyTargetAlreadyMetError(APIError):
    def __init__(self, message: str = "Weekly target has already been met"):
        super().__init__("WEEKLY_TARGET_ALREADY_MET", message, status.HTTP_400_BAD_REQUEST)


class TextRequiredError(APIError):
    def __init__(self, message: str = "Text is required for this habit"):
        super().__init__("TEXT_REQUIRED", message, status.HTTP_400_BAD_REQUEST)


class CompletionNotFoundError(APIError):
    def __init__(self, message: str = "Completion not found"):
        super().__init__("COMPLETION_NOT_FOUND", message, status.HTTP_404_NOT_FOUND)


class CompletionNotTodayError(APIError):
    def __init__(self, message: str = "Completions can only be deleted on the same day"):
        super().__init__("COMPLETION_NOT_TODAY", message, status.HTTP_400_BAD_REQUEST)


class GoalNotFoundError(APIError):
    def __init__(self, message: str = "Goal not found"):
        super().__init__("GOAL_NOT_FOUND", message, status.HTTP_404_NOT_FOUND)


class GoalDeletedError(APIError):
    def __init__(self, message: str = "Goal has been deleted"):
        super().__init__("GOAL_DELETED", message, status.HTTP_400_BAD_REQUEST)


class InternalError(APIError):
    def __init__(self, message: str = "Internal server error"):
        super().__init__("INTERNAL_ERROR", message, status.HTTP_500_INTERNAL_SERVER_ERROR)
