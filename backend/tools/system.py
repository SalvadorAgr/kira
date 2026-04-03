import subprocess
import shlex

def run_osascript(script: str) -> str:
    """Run an AppleScript command."""
    try:
        result = subprocess.run(
            ["osascript", "-e", script], 
            capture_output=True, 
            text=True, 
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        return f"Error executing AppleScript: {e.stderr}"

def open_app(app_name: str) -> str:
    """Open a macOS application."""
    sanitized_name = shlex.quote(app_name)
    script = f'tell application {sanitized_name} to activate'
    return run_osascript(script)

def set_volume(level: int) -> str:
    """Set system volume (0-100)."""
    if not (0 <= level <= 100):
        return "Volume must be between 0 and 100"
    script = f'set volume output volume {level}'
    return run_osascript(script)

def get_battery_status() -> str:
    """Get battery info using pmset."""
    try:
        result = subprocess.run(
            ["pmset", "-g", "batt"], 
            capture_output=True, 
            text=True
        )
        return result.stdout.strip()
    except FileNotFoundError:
        return "Battery information not available (pmset tool missing)."
