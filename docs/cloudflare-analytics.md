# Cloudflare Web Analytics 配置指南

## 启用步骤

1. **登录 Cloudflare Dashboard**
   - 访问 https://dash.cloudflare.com/
   - 选择 `edwardchen.com` 域名

2. **启用 Web Analytics**
   - 左侧菜单 → `Analytics` → `Web`
   - 点击 `Get started` 或 `Enable`
   - 等待 5-10 分钟初始化

3. **获取 Site ID**
   - 在 Web Analytics 页面找到 `Site ID`
   - 格式类似：`xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

4. **更新配置**
   - 将 Site ID 复制到 `.env` 文件：
     ```
     CF_ANALYTICS_SITE_ID=你的 SiteID
     ```

5. **验证**
   - 访问网站后，在 Cloudflare Dashboard 查看实时数据
   - 数据延迟约 15 分钟

## 隐私说明

- ✅ 无需 Cookie
- ✅ GDPR 合规
- ✅ IP 匿名化
- ✅ 无第三方追踪

## 监控指标

- 页面浏览量 (Pageviews)
- 独立访客 (Unique Visitors)
- 地理位置分布
- 设备类型
- 页面加载性能
