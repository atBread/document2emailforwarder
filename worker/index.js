export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // 跨域预检
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    if (url.pathname === "/submit" && request.method === "POST") {
      return handleSubmit(request, env);
    }
    return new Response("Not found", { status: 404 });
  }
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
          content: btoa(String.fromCharCode(...new Uint8Array(buf)))
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
      attachments
    };

    const res = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      return new Response("send failed", {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" }
      });
    }
    return new Response("ok", {
      status: 200,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response("error: " + e.message, {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }
}
