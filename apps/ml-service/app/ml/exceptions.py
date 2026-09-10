class ModelUnavailableError(RuntimeError):
    """Raised when a model artifact required for inference is missing or invalid."""


class InvalidInputError(ValueError):
    """Raised when request features fail preprocessing validation."""