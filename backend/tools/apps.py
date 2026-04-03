from .system import run_osascript
import webbrowser

def open_url(url: str) -> str:
    """Open a URL in the default browser."""
    try:
        webbrowser.open(url)
        return f"Opened {url}"
    except Exception as e:
        return f"Error opening URL: {str(e)}"

def create_file_on_desktop(filename: str, content: str) -> str:
    """Create a file on the user's Desktop."""
    import os
    desktop = os.path.expanduser("~/Desktop")
    filepath = os.path.join(desktop, filename)
    try:
        with open(filepath, "w") as f:
            f.write(content)
        return f"Created file at {filepath}"
    except Exception as e:
        return f"Error creating file: {str(e)}"
