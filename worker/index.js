/**
 * 环境变量（去 Worker 设置 -> Variables 添加，保密勾上）
 * MAIL_TO = "接收邮箱"
 * MAIL_FROM = "noreply@你的域名"
 * UPSTREAM = "https://xxx.github.io" 你的 github pages
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/submit" && request.method === "POST") {
      return handleSubmit(request, env);
    }

    // 其余路由代理 GitHub Pages
    const upstream = new URL(url.pathname + url.search, env.UPSTREAM);
    const newReq = new Request(upstream, request);
    return fetch(newReq);
  },
};

async function handleSubmit(req, env) {
  try {
    const formData = await req.formData();
    const attachments = [];
    let textBody = "收到表单提交：\n";

    for (const [key, val] of formData.entries()) {
      if (val instanceof File) {
        const buf = await val.arrayBuffer();
        attachments.push({
          filename: val.name,
          content: btoa(String.fromCharCode(...new Uint8Array(buf))),
        });
      } else {
        textBody += `${key}: ${val}\n`;
      }
    }

    const payload = {
      from: env.MAIL_FROM,
      to: [env.MAIL_TO],
      subject: "网站表单提交",
      text: textBody,
      attachments,
    };

    const res = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return new Response("发送失败", { status: 500 });
    }
    return new Response("ok", { status: 200 });
  } catch (e) {
    return new Response("error: " + e.message, { status: 500 });
  }
}
