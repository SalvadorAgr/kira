import sys
import json
import logging
from typing import Any, Dict, List, Optional
from tools.system import open_app, set_volume, get_battery_status
from tools.apps import open_url, create_file_on_desktop

# Configure logging to file as stdout is used for protocol
logging.basicConfig(filename='mcp_server.log', level=logging.DEBUG)

class MCPServer:
    def __init__(self):
        self.tools = {
            "open_app": self.wrap_tool(open_app, "Open a macOS application. Args: app_name"),
            "set_volume": self.wrap_tool(set_volume, "Set volume (0-100). Args: level"),
            "get_battery_status": self.wrap_tool(get_battery_status, "Get battery info."),
            "open_url": self.wrap_tool(open_url, "Open a URL in default browser. Args: url"),
            "create_file": self.wrap_tool(create_file_on_desktop, "Create file on Desktop. Args: filename, content")
        }

    def wrap_tool(self, func, description):
        return {
            "func": func,
            "description": description,
            # Schema could be more detailed, simplified for now
            "inputSchema": {
                "type": "object",
                "properties": {
                    "arg1": {"type": "string"} # Simplified assumption
                }
            }
        }

    def run(self):
        logging.info("MCP Server starting...")
        while True:
            try:
                line = sys.stdin.readline()
                if not line:
                    break
                request = json.loads(line)
                self.handle_request(request)
            except json.JSONDecodeError:
                logging.error("Invalid JSON received")
            except Exception as e:
                logging.error(f"Error loop: {e}")

    def handle_request(self, request: Dict):
        method = request.get("method")
        msg_id = request.get("id")
        params = request.get("params", {})

        logging.info(f"Received request: {method}")

        response = {
            "jsonrpc": "2.0",
            "id": msg_id
        }

        if method == "initialize":
            response["result"] = {
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {}
                },
                "serverInfo": {
                    "name": "psykira-mcp",
                    "version": "0.1.0"
                }
            }
        elif method == "notifications/initialized":
            # No response needed for notifications
            return
        elif method == "tools/list":
            tools_list = []
            for name, tool in self.tools.items():
                tools_list.append({
                    "name": name,
                    "description": tool["description"],
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "args": {"type": "string", "description": "Arguments for the function"}
                        }
                    } 
                })
            response["result"] = {
                "tools": tools_list
            }
        elif method == "tools/call":
            self.handle_tool_call(params, response)
        else:
            # Ping or other methods
            response["result"] = {}

        if msg_id is not None:
            sys.stdout.write(json.dumps(response) + "\n")
            sys.stdout.flush()

    def handle_tool_call(self, params: Dict, response: Dict):
        name = params.get("name")
        args = params.get("arguments", {})
        
        if name in self.tools:
            func = self.tools[name]["func"]
            try:
                # Inspect function args to call correctly
                # Simplified dynamic calling
                import inspect
                sig = inspect.signature(func)
                call_args = {}
                for param_name in sig.parameters:
                    if param_name in args:
                        val = args[param_name]
                        if sig.parameters[param_name].annotation == int:
                             val = int(val)
                        call_args[param_name] = val
                
                result = func(**call_args)
                response["result"] = {
                    "content": [{
                        "type": "text",
                        "text": str(result)
                    }]
                }
            except Exception as e:
                response["error"] = {
                    "code": -32603,
                    "message": f"Tool execution error: {str(e)}"
                }
        else:
            response["error"] = {
                "code": -32601,
                "message": "Method not found"
            }

if __name__ == "__main__":
    server = MCPServer()
    server.run()
