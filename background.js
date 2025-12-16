chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "lf_tools_base64",
    title: "LF Tools Base64",
    contexts: ["page", "selection", "editable"]
  });
});

function openLfToolsPopup(tabId, initialText) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: (initialText) => {
      try {
        const existing = document.getElementById("lf-tools-popup-overlay");
        if (existing) existing.remove();

        // Helpers
        function utf8ToBase64(str) {
          const encoder = new TextEncoder();
          const bytes = encoder.encode(str);
          let binary = "";
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          return btoa(binary);
        }

        function base64ToUtf8(b64) {
          b64 = b64.replace(/\s+/g, "");
          const binary = atob(b64);
          const len = binary.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const decoder = new TextDecoder();
          return decoder.decode(bytes);
        }

        function renderJsonTree(root, data) {
          root.innerHTML = "";
          const INDENT_UNIT = "       "; // 7 spaces per level

          const buildNode = (key, value, parent, depth, isLast) => {
            const indent = INDENT_UNIT.repeat(depth);

            if (value !== null && typeof value === "object") {
              const isArray = Array.isArray(value);

              const line = document.createElement("div");

              const indentSpan = document.createElement("span");
              indentSpan.textContent = indent;
              line.appendChild(indentSpan);

              const toggle = document.createElement("span");
              toggle.textContent = "▾ ";
              toggle.style.cursor = "pointer";
              toggle.style.userSelect = "none";
              line.appendChild(toggle);

              if (key !== null && key !== undefined && key !== "") {
                const keySpan = document.createElement("span");
                keySpan.style.color = "#4ea1ff";
                keySpan.textContent = JSON.stringify(key);
                line.appendChild(keySpan);
                line.appendChild(document.createTextNode(": "));
              }

              line.appendChild(document.createTextNode(isArray ? "[" : "{"));
              parent.appendChild(line);

              const childrenContainer = document.createElement("div");

              const entries = isArray
                ? value.map((v) => [null, v])
                : Object.entries(value);

              entries.forEach(([childKey, childVal], index) => {
                const lastChild = index === entries.length - 1;
                buildNode(childKey, childVal, childrenContainer, depth + 1, lastChild);
              });

              const closingLine = document.createElement("div");
              closingLine.textContent =
                indent + (isArray ? "]" : "}") + (isLast ? "" : ",");

              parent.appendChild(childrenContainer);
              parent.appendChild(closingLine);

              let collapsed = false;
              toggle.addEventListener("click", (e) => {
                e.stopPropagation();
                collapsed = !collapsed;
                childrenContainer.style.display = collapsed ? "none" : "block";
                toggle.textContent = collapsed ? "▸ " : "▾ ";
              });
            } else {
              const line = document.createElement("div");
              const indentSpan = document.createElement("span");
              indentSpan.textContent = indent;
              line.appendChild(indentSpan);

              if (key !== null && key !== undefined && key !== "") {
                const keySpan = document.createElement("span");
                keySpan.style.color = "#4ea1ff";
                keySpan.textContent = JSON.stringify(key);
                line.appendChild(keySpan);
                line.appendChild(document.createTextNode(": "));
              }

              let displayValue;
              if (typeof value === "string") {
                displayValue = JSON.stringify(value);
              } else {
                displayValue = String(value);
              }

              line.appendChild(
                document.createTextNode(displayValue + (isLast ? "" : ","))
              );
              parent.appendChild(line);
            }
          };

          buildNode(null, data, root, 0, true);
        }

        const overlay = document.createElement("div");
        overlay.id = "lf-tools-popup-overlay";
        Object.assign(overlay.style, {
          position: "fixed",
          inset: "0",
          background: "rgba(0, 0, 0, 0.6)",
          zIndex: "2147483647"
        });

        const box = document.createElement("div");
        Object.assign(box.style, {
          position: "fixed",
          padding: "8px 8px 0 8px",
          borderRadius: "6px",
          border: "1px solid #333333",
          boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
          boxSizing: "border-box",
          background: "#121212",
          color: "#f0f0f0",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          minWidth: "320px",
          minHeight: "200px",
          maxWidth: "80%",
          maxHeight: "80%",
          resize: "none",
          overflow: "visible",
          width: "1000px",
          height: "500px"
        });

        const header = document.createElement("div");
        Object.assign(header.style, {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "move",
          userSelect: "none",
          marginLeft: "3px"
        });

        const title = document.createElement("span");
        title.textContent = "LF Tools Base64";

        const closeBtn = document.createElement("button");
        closeBtn.textContent = "×";
        closeBtn.setAttribute("aria-label", "Close");
        Object.assign(closeBtn.style, {
          border: "none",
          background: "transparent",
          color: "#f0f0f0",
          fontSize: "18px",
          cursor: "pointer",
          lineHeight: "1",
          padding: "0 4px"
        });

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Container for the two text areas so they share available space
        const ioContainer = document.createElement("div");
        Object.assign(ioContainer.style, {
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          flex: "1 1 auto"
        });

        const inputArea = document.createElement("textarea");
        inputArea.value = initialText || "";
        Object.assign(inputArea.style, {
          width: "100%",
          padding: "8px",
          borderRadius: "4px",
          border: "1px solid #333333",
          boxSizing: "border-box",
          resize: "none",
          background: "#181818",
          color: "#f0f0f0",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
          fontSize: "12px",
          flex: "0 0 50%",
          minHeight: "60px"
        });

        // Splitter between input and output
        const splitter = document.createElement("div");
        Object.assign(splitter.style, {
          height: "6px",
          cursor: "row-resize",
          background: "#2a2a2a",
          borderRadius: "4px",
          flex: "0 0 auto"
        });

        const outputWrapper = document.createElement("div");
        Object.assign(outputWrapper.style, {
          position: "relative",
          flex: "0 0 50%"
        });

        const outputTextArea = document.createElement("textarea");
        Object.assign(outputTextArea.style, {
          width: "100%",
          height: "100%",
          padding: "8px",
          borderRadius: "4px",
          border: "1px solid #333333",
          boxSizing: "border-box",
          resize: "none",
          background: "#181818",
          color: "#f0f0f0",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
          fontSize: "12px"
        });

        const outputJson = document.createElement("div");
        Object.assign(outputJson.style, {
          position: "absolute",
          inset: "0",
          padding: "8px",
          borderRadius: "4px",
          border: "1px solid #333333",
          boxSizing: "border-box",
          background: "#181818",
          color: "#f0f0f0",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
          fontSize: "12px",
          whiteSpace: "pre",
          overflow: "auto",
          userSelect: "text",
          display: "none"
        });

        outputWrapper.appendChild(outputTextArea);
        outputWrapper.appendChild(outputJson);

        ioContainer.appendChild(inputArea);
        ioContainer.appendChild(splitter);
        ioContainer.appendChild(outputWrapper);

        const controls = document.createElement("div");
        Object.assign(controls.style, {
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "0",
          position: "relative",
          padding: "4px 0 8px 0",
          marginTop: "13px"
        });

        const mainBtn = document.createElement("button");
        const dropdownBtn = document.createElement("button");
        Object.assign(mainBtn.style, {
          padding: "4px 10px",
          borderRadius: "4px 0 0 4px",
          border: "1px solid #444444",
          background: "#242424",
          color: "#f0f0f0",
          cursor: "pointer",
          fontSize: "12px",
          margin: "0"
        });
        Object.assign(dropdownBtn.style, {
          padding: "4px 6px",
          borderRadius: "0 4px 4px 0",
          border: "1px solid #444444",
          borderLeft: "none",
          background: "#242424",
          color: "#f0f0f0",
          cursor: "pointer",
          fontSize: "12px",
          margin: "0"
        });
        dropdownBtn.textContent = "▾";

        const menu = document.createElement("div");
        Object.assign(menu.style, {
          position: "fixed",
          borderRadius: "4px",
          border: "1px solid #444444",
          background: "#1f1f1f",
          boxShadow: "0 4px 8px rgba(0,0,0,0.6)",
          fontSize: "12px",
          minWidth: "150px",
          display: "none",
          zIndex: "2147483647",
          color: "#f0f0f0"
        });

        let currentMode = "decode";
        const labels = {
          decode: "Decode",
          encode: "Encode",
          decodeJson: "Decode to JSON"
        };
        mainBtn.textContent = labels[currentMode];

        function showTextOutput(text) {
          outputJson.style.display = "none";
          outputTextArea.style.display = "block";
          outputTextArea.value = text;
        }

        function showJsonOutput(obj) {
          outputTextArea.style.display = "none";
          outputJson.style.display = "block";
          renderJsonTree(outputJson, obj);
        }

        function runAction() {
          const input = inputArea.value || "";
          if (!input) {
            showTextOutput("");
            return;
          }

          try {
            if (currentMode === "encode") {
              const encoded = utf8ToBase64(input);
              showTextOutput(encoded);
            } else if (currentMode === "decode") {
              const decoded = base64ToUtf8(input);
              showTextOutput(decoded);
            } else if (currentMode === "decodeJson") {
              const decoded = base64ToUtf8(input);
              try {
                const obj = JSON.parse(decoded);
                showJsonOutput(obj);
              } catch (e) {
                showTextOutput(decoded);
              }
            }
          } catch (e) {
            const message = e && e.message ? e.message : String(e);
            showTextOutput("Operation failed:\n\n" + message);
          }
        }

        function setMode(mode) {
          currentMode = mode;
          mainBtn.textContent = labels[mode];
          menu.style.display = "none";
          runAction(); // simulate click after changing action
        }

        function addMenuItem(mode, label) {
          const item = document.createElement("div");
          item.textContent = label;
          Object.assign(item.style, {
            padding: "4px 8px",
            cursor: "pointer"
          });
          item.addEventListener("mouseenter", () => {
            item.style.background = "#2a2a2a";
          });
          item.addEventListener("mouseleave", () => {
            item.style.background = "#1f1f1f";
          });
          item.addEventListener("mousedown", (e) => {
            e.preventDefault();
          });
          item.addEventListener("click", () => setMode(mode));
          menu.appendChild(item);
        }

        addMenuItem("decode", "Decode");
        addMenuItem("encode", "Encode");
        addMenuItem("decodeJson", "Decode to JSON");

        dropdownBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (menu.style.display === "none") {
            const rect = dropdownBtn.getBoundingClientRect();
            menu.style.left = rect.left + "px";
            menu.style.top = rect.bottom + 2 + "px";
            menu.style.display = "block";
          } else {
            menu.style.display = "none";
          }
        });

        mainBtn.addEventListener("click", () => {
          runAction();
        });

        controls.appendChild(mainBtn);
        controls.appendChild(dropdownBtn);

        box.appendChild(header);
        box.appendChild(ioContainer);
        box.appendChild(controls);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        document.body.appendChild(menu);

        // Splitter drag logic using flex-basis percentages
        let isSplitDragging = false;
        let startSplitY = 0;
        let startInputHeight = 0;
        let startOutputHeight = 0;
        let totalHeight = 0;

        splitter.addEventListener("mousedown", (e) => {
          e.preventDefault();
          e.stopPropagation();
          isSplitDragging = true;
          const inputRect = inputArea.getBoundingClientRect();
          const outputRect = outputWrapper.getBoundingClientRect();
          startSplitY = e.clientY;
          startInputHeight = inputRect.height;
          startOutputHeight = outputRect.height;
          totalHeight = startInputHeight + startOutputHeight;
          document.body.style.cursor = "row-resize";
        });

        const onKeyDown = (e) => {
          if (e.key === "Escape") {
            cleanup();
          }
        };

        function cleanup() {
          overlay.remove();
          menu.remove();
          document.removeEventListener("keydown", onKeyDown);
          window.removeEventListener("mousemove", onMouseMove);
          window.removeEventListener("mouseup", onMouseUp);
          document.body.style.cursor = "";
        }

        closeBtn.addEventListener("click", () => {
          cleanup();
        });

        document.addEventListener("keydown", onKeyDown);

        // Center box initially (after size is set)
        const rect = box.getBoundingClientRect();
        box.style.left = (window.innerWidth - rect.width) / 2 + "px";
        box.style.top = (window.innerHeight - rect.height) / 2 + "px";

        // Try to auto-decode initial text into result
        if (initialText && initialText.trim()) {
          try {
            const decodedInitial = base64ToUtf8(initialText);
            showTextOutput(decodedInitial);
          } catch (e) {
            showTextOutput("");
          }
        }

        // Close on outside click (mousedown only on overlay)
        overlay.addEventListener("mousedown", (e) => {
          if (e.target === overlay) {
            cleanup();
          }
        });

        // Resizing and dragging of the whole popup
        const EDGE_SIZE = 8;
        const MIN_WIDTH = 320;
        const MIN_HEIGHT = 200;
        let isResizing = false;
        let resizeEdge = null;
        let isDragging = false;
        let startX, startY, startLeft, startTop, startRight, startBottom;

        function getEdge(e) {
          const r = box.getBoundingClientRect();
          const x = e.clientX - r.left;
          const y = e.clientY - r.top;
          const nearLeft = x <= EDGE_SIZE;
          const nearRight = x >= r.width - EDGE_SIZE;
          const nearTop = y <= EDGE_SIZE;
          const nearBottom = y >= r.height - EDGE_SIZE;

          if (nearTop && nearLeft) return "nw";
          if (nearTop && nearRight) return "ne";
          if (nearBottom && nearLeft) return "sw";
          if (nearBottom && nearRight) return "se";
          if (nearLeft) return "w";
          if (nearRight) return "e";
          if (nearTop) return "n";
          if (nearBottom) return "s";
          return null;
        }

        box.addEventListener("mousemove", (e) => {
          if (isResizing || isDragging || isSplitDragging) return;
          const edge = getEdge(e);
          let cursor = "default";
          if (edge === "n" || edge === "s") cursor = "ns-resize";
          else if (edge === "e" || edge === "w") cursor = "ew-resize";
          else if (edge === "ne" || edge === "sw") cursor = "nesw-resize";
          else if (edge === "nw" || edge === "se") cursor = "nwse-resize";
          else cursor = "default";
          box.style.cursor = cursor;
        });

        box.addEventListener("mousedown", (e) => {
          if (header.contains(e.target) || splitter.contains(e.target)) return;

          const edge = getEdge(e);
          if (!edge) return;
          e.preventDefault();
          e.stopPropagation();
          isResizing = true;
          resizeEdge = edge;

          const r = box.getBoundingClientRect();
          startX = e.clientX;
          startY = e.clientY;
          startLeft = r.left;
          startTop = r.top;
          startRight = r.right;
          startBottom = r.bottom;
        });

        header.addEventListener("mousedown", (e) => {
          if (e.target === closeBtn) return;
          e.preventDefault();
          e.stopPropagation();
          isDragging = true;
          const r = box.getBoundingClientRect();
          startX = e.clientX;
          startY = e.clientY;
          startLeft = r.left;
          startTop = r.top;
        });

        function onMouseMove(e) {
          if (isResizing) {
            let newLeft = startLeft;
            let newTop = startTop;
            let newRight = startRight;
            let newBottom = startBottom;

            if (resizeEdge.includes("e")) {
              newRight = Math.max(startLeft + MIN_WIDTH, e.clientX);
            }
            if (resizeEdge.includes("s")) {
              newBottom = Math.max(startTop + MIN_HEIGHT, e.clientY);
            }
            if (resizeEdge.includes("w")) {
              newLeft = Math.min(startRight - MIN_WIDTH, e.clientX);
            }
            if (resizeEdge.includes("n")) {
              newTop = Math.min(startBottom - MIN_HEIGHT, e.clientY);
            }

            const width = newRight - newLeft;
            const height = newBottom - newTop;

            box.style.left = newLeft + "px";
            box.style.top = newTop + "px";
            box.style.width = width + "px";
            box.style.height = height + "px";
            return;
          }

          if (isDragging) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            box.style.left = startLeft + dx + "px";
            box.style.top = startTop + dy + "px";
            return;
          }

          if (isSplitDragging) {
            const dy = e.clientY - startSplitY;
            const minPanel = 60;
            let newInputHeight = startInputHeight + dy;
            if (newInputHeight < minPanel) newInputHeight = minPanel;
            if (newInputHeight > totalHeight - minPanel) newInputHeight = totalHeight - minPanel;
            const newOutputHeight = totalHeight - newInputHeight;

            const inputPercent = (newInputHeight / totalHeight) * 100;
            const outputPercent = (newOutputHeight / totalHeight) * 100;

            inputArea.style.flex = "0 0 " + inputPercent + "%";
            outputWrapper.style.flex = "0 0 " + outputPercent + "%";
            return;
          }
        }

        function onMouseUp() {
          isResizing = false;
          resizeEdge = null;
          isDragging = false;
          if (isSplitDragging) {
            isSplitDragging = false;
            document.body.style.cursor = "";
          }
        }

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
      } catch (e) {
        alert("LF Tools error: " + (e && e.message ? e.message : String(e)));
      }
    },
    args: [initialText]
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || tab.id === undefined) return;

  const selection = (info.selectionText || "").trim();
  if (selection) {
    openLfToolsPopup(tab.id, selection);
    return;
  }

  // No selection: try to pull clipboard text and use it as initial input.
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async () => {
        try {
          const text = await navigator.clipboard.readText();
          return (text || "").trim();
        } catch (e) {
          return "";
        }
      }
    });

    const clipboardText = (result || "").trim();
    openLfToolsPopup(tab.id, clipboardText);
  } catch (e) {
    // Fallback: open empty if clipboard read fails (permissions / page restrictions).
    openLfToolsPopup(tab.id, "");
  }
});
