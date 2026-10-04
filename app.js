(function () {
  "use strict";

  var configuredApi = window.CALCULATOR_API_BASE;
  var localPorts = ["5500", "5501", "8080"];
  var apiBase = configuredApi || (localPorts.indexOf(window.location.port) >= 0 ? "http://127.0.0.1:8000" : "");
  var state = { page: 1, pages: 1, query: "", loading: false };

  var expression = document.getElementById("expression");
  var result = document.getElementById("result");
  var message = document.getElementById("message");
  var historyList = document.getElementById("historyList");
  var pageStatus = document.getElementById("pageStatus");
  var previousPage = document.getElementById("previousPage");
  var nextPage = document.getElementById("nextPage");
  var connectionStatus = document.getElementById("connectionStatus");
  var totalCalculations = document.getElementById("totalCalculations");
  var toast = document.getElementById("toast");
  var searchTimer;
  var toastTimer;

  function endpoint(path) {
    return apiBase + path;
  }

  async function api(path, options) {
    var response;
    try {
      response = await fetch(endpoint(path), options);
    } catch (error) {
      setConnection(false);
      throw new Error("无法连接后端服务，请确认 API 已启动");
    }

    var body = {};
    try {
      body = await response.json();
    } catch (error) {
      body = {};
    }

    if (!response.ok) {
      var detail = body.detail;
      var detailMessage = detail && typeof detail === "object" ? detail.message : detail;
      throw new Error(body.message || detailMessage || "请求失败，请稍后重试");
    }
    setConnection(true);
    return body;
  }

  function setConnection(online) {
    connectionStatus.classList.toggle("online", online);
    connectionStatus.classList.toggle("offline", !online);
    connectionStatus.lastChild.textContent = online ? " 后端已连接" : " 后端未连接";
  }

  function appendValue(value) {
    var start = expression.selectionStart == null ? expression.value.length : expression.selectionStart;
    var end = expression.selectionEnd == null ? expression.value.length : expression.selectionEnd;
    expression.value = expression.value.slice(0, start) + value + expression.value.slice(end);
    var caret = start + value.length;
    expression.focus();
    expression.setSelectionRange(caret, caret);
    message.textContent = "";
  }

  function clearCalculator() {
    expression.value = "";
    result.textContent = "0";
    message.textContent = "";
    expression.focus();
  }

  async function calculate() {
    var value = expression.value.trim();
    if (!value || state.loading) {
      if (!value) message.textContent = "请输入要计算的表达式";
      return;
    }

    state.loading = true;
    document.getElementById("calculate").textContent = "···";
    message.textContent = "";
    try {
      var body = await api("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expression: value })
      });
      result.textContent = String(body.result);
      expression.value = body.expression;
      state.page = 1;
      await Promise.all([loadHistory(), loadStats()]);
      showToast("计算完成，记录已保存到数据库");
    } catch (error) {
      message.textContent = error.message;
    } finally {
      state.loading = false;
      document.getElementById("calculate").textContent = "=";
    }
  }

  function escapeHtml(value) {
    var node = document.createElement("span");
    node.textContent = value;
    return node.innerHTML;
  }

  function formatTime(value) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  async function loadHistory() {
    try {
      var query = new URLSearchParams({
        q: state.query,
        page: String(state.page),
        page_size: "6"
      });
      var body = await api("/api/history?" + query.toString());
      state.pages = body.pages;
      if (body.items.length === 0) {
        historyList.innerHTML =
          '<div class="empty-state"><span aria-hidden="true">∿</span><strong>' +
          (state.query ? "没有匹配的记录" : "还没有计算记录") +
          "</strong><p>" +
          (state.query ? "换一个关键词试试。" : "完成一次计算后，记录会持久保存在后端数据库。") +
          "</p></div>";
      } else {
        historyList.innerHTML = body.items.map(function (item) {
          return '<article class="history-item" data-id="' + item.id + '">' +
            "<div><div class=\"history-expression\">" + escapeHtml(item.expression) + "</div>" +
            '<div class="history-result">= ' + escapeHtml(item.result) + "</div>" +
            '<div class="history-meta">#' + item.id + " · " + escapeHtml(formatTime(item.created_at)) + "</div></div>" +
            '<button class="delete-history" type="button" data-delete-id="' + item.id + '" aria-label="删除记录 ' + item.id + '">×</button>' +
            "</article>";
        }).join("");
      }
      pageStatus.textContent = "第 " + body.page + " / " + body.pages + " 页";
      previousPage.disabled = body.page <= 1;
      nextPage.disabled = body.page >= body.pages;
    } catch (error) {
      historyList.innerHTML = '<div class="empty-state"><span>!</span><strong>历史记录暂不可用</strong><p>' + escapeHtml(error.message) + "</p></div>";
    }
  }

  async function loadStats() {
    try {
      var body = await api("/api/history/stats");
      totalCalculations.textContent = String(body.total || 0);
    } catch (error) {
      totalCalculations.textContent = "—";
    }
  }

  async function deleteRecord(id) {
    try {
      await api("/api/history/" + id, { method: "DELETE" });
      await Promise.all([loadHistory(), loadStats()]);
      showToast("已从数据库删除该条记录");
    } catch (error) {
      showToast(error.message);
    }
  }

  async function clearAllHistory() {
    try {
      var body = await api("/api/history", { method: "DELETE" });
      state.page = 1;
      await Promise.all([loadHistory(), loadStats()]);
      showToast("已清空 " + body.deleted + " 条历史记录");
    } catch (error) {
      showToast(error.message);
    }
  }

  function showToast(text) {
    window.clearTimeout(toastTimer);
    toast.textContent = text;
    toast.classList.add("visible");
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("visible");
    }, 2600);
  }

  document.querySelectorAll("[data-value]").forEach(function (button) {
    button.addEventListener("click", function () { appendValue(button.dataset.value); });
  });

  document.querySelector("[data-action=clear]").addEventListener("click", clearCalculator);
  document.getElementById("calculate").addEventListener("click", calculate);
  document.getElementById("backspace").addEventListener("click", function () {
    var start = expression.selectionStart == null ? expression.value.length : expression.selectionStart;
    var end = expression.selectionEnd == null ? expression.value.length : expression.selectionEnd;
    if (start !== end) {
      expression.value = expression.value.slice(0, start) + expression.value.slice(end);
      expression.setSelectionRange(start, start);
    } else if (start > 0) {
      expression.value = expression.value.slice(0, start - 1) + expression.value.slice(end);
      expression.setSelectionRange(start - 1, start - 1);
    }
    expression.focus();
  });

  expression.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      calculate();
    }
    if (event.key === "Escape") clearCalculator();
  });

  historyList.addEventListener("click", function (event) {
    var deleteButton = event.target.closest("[data-delete-id]");
    var item = event.target.closest(".history-item");
    if (deleteButton) {
      deleteRecord(deleteButton.dataset.deleteId);
    } else if (item) {
      var value = item.querySelector(".history-expression").textContent;
      expression.value = value;
      expression.focus();
      showToast("表达式已填入计算器");
    }
  });

  document.getElementById("historySearch").addEventListener("input", function (event) {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(function () {
      state.query = event.target.value.trim();
      state.page = 1;
      loadHistory();
    }, 250);
  });

  previousPage.addEventListener("click", function () {
    if (state.page > 1) {
      state.page -= 1;
      loadHistory();
    }
  });

  nextPage.addEventListener("click", function () {
    if (state.page < state.pages) {
      state.page += 1;
      loadHistory();
    }
  });

  document.getElementById("copyResult").addEventListener("click", async function () {
    try {
      await navigator.clipboard.writeText(result.textContent);
      showToast("结果已复制");
    } catch (error) {
      showToast("复制失败，请手动选择结果");
    }
  });

  var clearDialog = document.getElementById("clearDialog");
  document.getElementById("clearHistory").addEventListener("click", function () {
    clearDialog.showModal();
  });
  clearDialog.addEventListener("close", function () {
    if (clearDialog.returnValue === "confirm") clearAllHistory();
  });

  document.getElementById("themeToggle").addEventListener("click", function () {
    var current = document.documentElement.dataset.theme;
    var next = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("calculator-theme", next);
    document.getElementById("themeToggle").firstElementChild.textContent = next === "dark" ? "☼" : "☾";
  });

  var savedTheme = localStorage.getItem("calculator-theme");
  if (savedTheme === "light" || savedTheme === "dark") {
    document.documentElement.dataset.theme = savedTheme;
  }
  document.getElementById("themeToggle").firstElementChild.textContent = document.documentElement.dataset.theme === "dark" ? "☼" : "☾";

  var sharedExpression = new URLSearchParams(window.location.search).get("expression");
  if (sharedExpression) {
    expression.value = sharedExpression.slice(0, 200);
  }

  Promise.all([loadHistory(), loadStats()]).then(function () {
    var shouldRunSharedExpression = new URLSearchParams(window.location.search).get("autorun") === "1";
    if (sharedExpression && shouldRunSharedExpression) calculate();
  });
})();
