var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => InstagramViewer
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");

// src/electron-fetch.ts
async function electronFetch(url, options) {
  try {
    console.log("Starting electron fetch for URL:", url);
    const electron = window.require ? window.require("electron") : require("electron");
    const { net } = electron.remote || electron;
    return new Promise((resolve, reject) => {
      const request = net.request({
        method: options.method || "GET",
        url,
        headers: options.headers || {},
        protocol: "https:",
        redirect: "follow"
      });
      const chunks = [];
      const timeout = options.timeout || 1e4;
      let hasCompleted = false;
      const timeoutId = setTimeout(() => {
        if (!hasCompleted) {
          request.abort();
          reject(new Error(`Request timed out after ${timeout / 1e3} seconds`));
        }
      }, timeout);
      request.on("response", (response) => {
        console.log(`Response status: ${response.statusCode}`);
        if (response.statusCode !== 200) {
          clearTimeout(timeoutId);
          reject(new Error(`HTTP Error: ${response.statusCode}`));
          return;
        }
        response.on("data", (chunk) => {
          chunks.push(chunk);
          console.log(`Received chunk of size: ${chunk.length}`);
        });
        response.on("end", () => {
          hasCompleted = true;
          clearTimeout(timeoutId);
          try {
            const data = Buffer.concat(chunks).toString("utf8");
            console.log("Response completed, data length:", data.length);
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            reject(error);
          }
        });
        response.on("error", (error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
      });
      request.on("error", (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
      request.on("abort", () => {
        if (!hasCompleted) {
          clearTimeout(timeoutId);
          reject(new Error("Request was aborted"));
        }
      });
      request.end();
    });
  } catch (error) {
    console.error("Electron fetch error:", error);
    throw error;
  }
}

// src/instagram.ts
async function getInstagramData(username, sessionId) {
  var _a, _b, _c;
  try {
    console.log("Starting Instagram data fetch for user:", username);
    const userUrl = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
    const headers = {
      "Accept": "*/*",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "X-IG-App-ID": "936619743392459",
      "X-ASBD-ID": "198387",
      "X-IG-WWW-Claim": "0",
      "X-Requested-With": "XMLHttpRequest",
      "Cookie": `sessionid=${sessionId}`,
      "Origin": "https://www.instagram.com",
      "Referer": `https://www.instagram.com/${username}/`,
      "Accept-Language": "en-US,en;q=0.9"
    };
    console.log("Fetching user data...");
    const userData = await electronFetch(userUrl, {
      method: "GET",
      headers,
      timeout: 1e4
      // 10 second timeout
    });
    if (!((_c = (_b = (_a = userData == null ? void 0 : userData.data) == null ? void 0 : _a.user) == null ? void 0 : _b.edge_owner_to_timeline_media) == null ? void 0 : _c.edges)) {
      throw new Error("No user data found in response");
    }
    const edges = userData.data.user.edge_owner_to_timeline_media.edges;
    console.log(`Found ${edges.length} posts`);
    return edges.map((edge) => {
      var _a2, _b2, _c2, _d;
      return {
        id: edge.node.id,
        shortcode: edge.node.shortcode,
        caption: ((_a2 = edge.node.edge_media_to_caption.edges[0]) == null ? void 0 : _a2.node.text) || "",
        url: `https://www.instagram.com/p/${edge.node.shortcode}/`,
        imageUrl: edge.node.display_url,
        timestamp: edge.node.taken_at_timestamp,
        isVideo: edge.node.is_video,
        videoUrl: edge.node.video_url,
        type: edge.node.is_video ? "video" : edge.node.__typename === "GraphSidecar" ? "carousel" : "image",
        carouselMedia: (_b2 = edge.node.edge_sidecar_to_children) == null ? void 0 : _b2.edges.map((child) => ({
          url: child.node.display_url,
          isVideo: child.node.is_video,
          videoUrl: child.node.video_url
        })),
        likes: ((_c2 = edge.node.edge_media_preview_like) == null ? void 0 : _c2.count) || 0,
        comments: ((_d = edge.node.edge_media_to_comment) == null ? void 0 : _d.count) || 0
      };
    });
  } catch (error) {
    console.error("Error in getInstagramData:", error);
    throw error;
  }
}

// main.ts
var DEFAULT_SETTINGS = {
  sessionId: ""
};
var InstagramViewer = class extends import_obsidian.Plugin {
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new InstagramViewerSettingTab(this.app, this));
    window.InstagramViewer = {
      getFeed: async (username) => {
        if (!this.settings.sessionId) {
          throw new Error("Instagram session ID not set. Please set it in plugin settings.");
        }
        try {
          return await getInstagramData(username, this.settings.sessionId);
        } catch (error) {
          console.error("Error fetching Instagram data:", error);
          throw error;
        }
      },
      getSettings: () => {
        var _a;
        return {
          hasSessionId: !!this.settings.sessionId,
          sessionIdLength: ((_a = this.settings.sessionId) == null ? void 0 : _a.length) || 0
        };
      }
    };
  }
  onunload() {
    delete window.InstagramViewer;
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
var InstagramViewerSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("Instagram Session ID").setDesc("Your Instagram session ID").addText((text) => text.setPlaceholder("Enter your session ID").setValue(this.plugin.settings.sessionId).onChange(async (value) => {
      this.plugin.settings.sessionId = value;
      await this.plugin.saveSettings();
    }));
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvZWxlY3Ryb24tZmV0Y2gudHMiLCAic3JjL2luc3RhZ3JhbS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gbWFpbi50c1xyXG5pbXBvcnQgeyBBcHAsIFBsdWdpbiwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZyB9IGZyb20gJ29ic2lkaWFuJztcclxuaW1wb3J0IHsgZ2V0SW5zdGFncmFtRGF0YSB9IGZyb20gJy4vc3JjL2luc3RhZ3JhbSc7XHJcblxyXG5pbnRlcmZhY2UgSW5zdGFncmFtVmlld2VyU2V0dGluZ3Mge1xyXG4gICAgc2Vzc2lvbklkOiBzdHJpbmc7XHJcbn1cclxuXHJcbmNvbnN0IERFRkFVTFRfU0VUVElOR1M6IEluc3RhZ3JhbVZpZXdlclNldHRpbmdzID0ge1xyXG4gICAgc2Vzc2lvbklkOiAnJ1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBJbnN0YWdyYW1WaWV3ZXIgZXh0ZW5kcyBQbHVnaW4ge1xyXG4gICAgc2V0dGluZ3M6IEluc3RhZ3JhbVZpZXdlclNldHRpbmdzO1xyXG5cclxuICAgIGFzeW5jIG9ubG9hZCgpIHtcclxuICAgICAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xyXG5cclxuICAgICAgICAvLyBBZGQgc2V0dGluZ3MgdGFiXHJcbiAgICAgICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBJbnN0YWdyYW1WaWV3ZXJTZXR0aW5nVGFiKHRoaXMuYXBwLCB0aGlzKSk7XHJcblxyXG4gICAgICAgIC8vIFJlZ2lzdGVyIHRoZSBJbnN0YWdyYW1WaWV3ZXIgZ2xvYmFsXHJcbiAgICAgICAgKHdpbmRvdyBhcyBhbnkpLkluc3RhZ3JhbVZpZXdlciA9IHtcclxuICAgICAgICAgICAgZ2V0RmVlZDogYXN5bmMgKHVzZXJuYW1lOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5zZXR0aW5ncy5zZXNzaW9uSWQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luc3RhZ3JhbSBzZXNzaW9uIElEIG5vdCBzZXQuIFBsZWFzZSBzZXQgaXQgaW4gcGx1Z2luIHNldHRpbmdzLicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgZ2V0SW5zdGFncmFtRGF0YSh1c2VybmFtZSwgdGhpcy5zZXR0aW5ncy5zZXNzaW9uSWQpO1xyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBmZXRjaGluZyBJbnN0YWdyYW0gZGF0YTonLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGdldFNldHRpbmdzOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGhhc1Nlc3Npb25JZDogISF0aGlzLnNldHRpbmdzLnNlc3Npb25JZCxcclxuICAgICAgICAgICAgICAgICAgICBzZXNzaW9uSWRMZW5ndGg6IHRoaXMuc2V0dGluZ3Muc2Vzc2lvbklkPy5sZW5ndGggfHwgMFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgb251bmxvYWQoKSB7XHJcbiAgICAgICAgZGVsZXRlICh3aW5kb3cgYXMgYW55KS5JbnN0YWdyYW1WaWV3ZXI7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgbG9hZFNldHRpbmdzKCkge1xyXG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX1NFVFRJTkdTLCBhd2FpdCB0aGlzLmxvYWREYXRhKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHNhdmVTZXR0aW5ncygpIHtcclxuICAgICAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBJbnN0YWdyYW1WaWV3ZXJTZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XHJcbiAgICBwbHVnaW46IEluc3RhZ3JhbVZpZXdlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBJbnN0YWdyYW1WaWV3ZXIpIHtcclxuICAgICAgICBzdXBlcihhcHAsIHBsdWdpbik7XHJcbiAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XHJcbiAgICB9XHJcblxyXG4gICAgZGlzcGxheSgpOiB2b2lkIHtcclxuICAgICAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xyXG4gICAgICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XHJcblxyXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZSgnSW5zdGFncmFtIFNlc3Npb24gSUQnKVxyXG4gICAgICAgICAgICAuc2V0RGVzYygnWW91ciBJbnN0YWdyYW0gc2Vzc2lvbiBJRCcpXHJcbiAgICAgICAgICAgIC5hZGRUZXh0KHRleHQgPT4gdGV4dFxyXG4gICAgICAgICAgICAgICAgLnNldFBsYWNlaG9sZGVyKCdFbnRlciB5b3VyIHNlc3Npb24gSUQnKVxyXG4gICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNlc3Npb25JZClcclxuICAgICAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zZXNzaW9uSWQgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuICAgIH1cclxufSIsICIvLyBzcmMvZWxlY3Ryb24tZmV0Y2gudHNcclxuaW1wb3J0IHsgSW5zdGFncmFtQVBJUmVzcG9uc2UgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbmRlY2xhcmUgY29uc3QgcmVxdWlyZTogYW55O1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVsZWN0cm9uRmV0Y2godXJsOiBzdHJpbmcsIG9wdGlvbnM6IGFueSk6IFByb21pc2U8SW5zdGFncmFtQVBJUmVzcG9uc2U+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ1N0YXJ0aW5nIGVsZWN0cm9uIGZldGNoIGZvciBVUkw6JywgdXJsKTtcclxuICAgICAgICBcclxuICAgICAgICBjb25zdCBlbGVjdHJvbiA9IHdpbmRvdy5yZXF1aXJlID8gd2luZG93LnJlcXVpcmUoJ2VsZWN0cm9uJykgOiByZXF1aXJlKCdlbGVjdHJvbicpO1xyXG4gICAgICAgIGNvbnN0IHsgbmV0IH0gPSBlbGVjdHJvbi5yZW1vdGUgfHwgZWxlY3Ryb247XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBuZXQucmVxdWVzdCh7XHJcbiAgICAgICAgICAgICAgICBtZXRob2Q6IG9wdGlvbnMubWV0aG9kIHx8ICdHRVQnLFxyXG4gICAgICAgICAgICAgICAgdXJsOiB1cmwsXHJcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiBvcHRpb25zLmhlYWRlcnMgfHwge30sXHJcbiAgICAgICAgICAgICAgICBwcm90b2NvbDogJ2h0dHBzOicsXHJcbiAgICAgICAgICAgICAgICByZWRpcmVjdDogJ2ZvbGxvdydcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBjaHVua3M6IEJ1ZmZlcltdID0gW107XHJcbiAgICAgICAgICAgIGNvbnN0IHRpbWVvdXQgPSBvcHRpb25zLnRpbWVvdXQgfHwgMTAwMDA7IC8vIERlZmF1bHQgMTAgc2Vjb25kIHRpbWVvdXRcclxuICAgICAgICAgICAgbGV0IGhhc0NvbXBsZXRlZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgdGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWhhc0NvbXBsZXRlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3QuYWJvcnQoKTtcclxuICAgICAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKGBSZXF1ZXN0IHRpbWVkIG91dCBhZnRlciAke3RpbWVvdXQvMTAwMH0gc2Vjb25kc2ApKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSwgdGltZW91dCk7XHJcblxyXG4gICAgICAgICAgICByZXF1ZXN0Lm9uKCdyZXNwb25zZScsIChyZXNwb25zZTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgUmVzcG9uc2Ugc3RhdHVzOiAke3Jlc3BvbnNlLnN0YXR1c0NvZGV9YCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1c0NvZGUgIT09IDIwMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoYEhUVFAgRXJyb3I6ICR7cmVzcG9uc2Uuc3RhdHVzQ29kZX1gKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLm9uKCdkYXRhJywgKGNodW5rOiBCdWZmZXIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjaHVua3MucHVzaChjaHVuayk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFJlY2VpdmVkIGNodW5rIG9mIHNpemU6ICR7Y2h1bmsubGVuZ3RofWApO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2Uub24oJ2VuZCcsICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBoYXNDb21wbGV0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBCdWZmZXIuY29uY2F0KGNodW5rcykudG9TdHJpbmcoJ3V0ZjgnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1Jlc3BvbnNlIGNvbXBsZXRlZCwgZGF0YSBsZW5ndGg6JywgZGF0YS5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBqc29uRGF0YSA9IEpTT04ucGFyc2UoZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoanNvbkRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2Uub24oJ2Vycm9yJywgKGVycm9yOiBFcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXF1ZXN0Lm9uKCdlcnJvcicsIChlcnJvcjogRXJyb3IpID0+IHtcclxuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXF1ZXN0Lm9uKCdhYm9ydCcsICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghaGFzQ29tcGxldGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcignUmVxdWVzdCB3YXMgYWJvcnRlZCcpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXF1ZXN0LmVuZCgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdFbGVjdHJvbiBmZXRjaCBlcnJvcjonLCBlcnJvcik7XHJcbiAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICB9XHJcbn0iLCAiLy8gc3JjL2luc3RhZ3JhbS50c1xyXG5pbXBvcnQgeyBJbnN0YWdyYW1Qb3N0IH0gZnJvbSAnLi90eXBlcyc7XHJcbmltcG9ydCB7IGVsZWN0cm9uRmV0Y2ggfSBmcm9tICcuL2VsZWN0cm9uLWZldGNoJztcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRJbnN0YWdyYW1EYXRhKHVzZXJuYW1lOiBzdHJpbmcsIHNlc3Npb25JZDogc3RyaW5nKTogUHJvbWlzZTxJbnN0YWdyYW1Qb3N0W10+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ1N0YXJ0aW5nIEluc3RhZ3JhbSBkYXRhIGZldGNoIGZvciB1c2VyOicsIHVzZXJuYW1lKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBGaXJzdCwgZ2V0IHRoZSB1c2VyIElEXHJcbiAgICAgICAgY29uc3QgdXNlclVybCA9IGBodHRwczovL2kuaW5zdGFncmFtLmNvbS9hcGkvdjEvdXNlcnMvd2ViX3Byb2ZpbGVfaW5mby8/dXNlcm5hbWU9JHt1c2VybmFtZX1gO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnN0IGhlYWRlcnMgPSB7XHJcbiAgICAgICAgICAgICdBY2NlcHQnOiAnKi8qJyxcclxuICAgICAgICAgICAgJ1VzZXItQWdlbnQnOiAnTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEyMC4wLjAuMCBTYWZhcmkvNTM3LjM2JyxcclxuICAgICAgICAgICAgJ1gtSUctQXBwLUlEJzogJzkzNjYxOTc0MzM5MjQ1OScsXHJcbiAgICAgICAgICAgICdYLUFTQkQtSUQnOiAnMTk4Mzg3JyxcclxuICAgICAgICAgICAgJ1gtSUctV1dXLUNsYWltJzogJzAnLFxyXG4gICAgICAgICAgICAnWC1SZXF1ZXN0ZWQtV2l0aCc6ICdYTUxIdHRwUmVxdWVzdCcsXHJcbiAgICAgICAgICAgICdDb29raWUnOiBgc2Vzc2lvbmlkPSR7c2Vzc2lvbklkfWAsXHJcbiAgICAgICAgICAgICdPcmlnaW4nOiAnaHR0cHM6Ly93d3cuaW5zdGFncmFtLmNvbScsXHJcbiAgICAgICAgICAgICdSZWZlcmVyJzogYGh0dHBzOi8vd3d3Lmluc3RhZ3JhbS5jb20vJHt1c2VybmFtZX0vYCxcclxuICAgICAgICAgICAgJ0FjY2VwdC1MYW5ndWFnZSc6ICdlbi1VUyxlbjtxPTAuOSdcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBjb25zb2xlLmxvZygnRmV0Y2hpbmcgdXNlciBkYXRhLi4uJyk7XHJcbiAgICAgICAgY29uc3QgdXNlckRhdGEgPSBhd2FpdCBlbGVjdHJvbkZldGNoKHVzZXJVcmwsIHtcclxuICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcclxuICAgICAgICAgICAgaGVhZGVyczogaGVhZGVycyxcclxuICAgICAgICAgICAgdGltZW91dDogMTAwMDAgLy8gMTAgc2Vjb25kIHRpbWVvdXRcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKCF1c2VyRGF0YT8uZGF0YT8udXNlcj8uZWRnZV9vd25lcl90b190aW1lbGluZV9tZWRpYT8uZWRnZXMpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyB1c2VyIGRhdGEgZm91bmQgaW4gcmVzcG9uc2UnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGVkZ2VzID0gdXNlckRhdGEuZGF0YS51c2VyLmVkZ2Vfb3duZXJfdG9fdGltZWxpbmVfbWVkaWEuZWRnZXM7XHJcbiAgICAgICAgY29uc29sZS5sb2coYEZvdW5kICR7ZWRnZXMubGVuZ3RofSBwb3N0c2ApO1xyXG5cclxuICAgICAgICByZXR1cm4gZWRnZXMubWFwKGVkZ2UgPT4gKHtcclxuICAgICAgICAgICAgaWQ6IGVkZ2Uubm9kZS5pZCxcclxuICAgICAgICAgICAgc2hvcnRjb2RlOiBlZGdlLm5vZGUuc2hvcnRjb2RlLFxyXG4gICAgICAgICAgICBjYXB0aW9uOiBlZGdlLm5vZGUuZWRnZV9tZWRpYV90b19jYXB0aW9uLmVkZ2VzWzBdPy5ub2RlLnRleHQgfHwgJycsXHJcbiAgICAgICAgICAgIHVybDogYGh0dHBzOi8vd3d3Lmluc3RhZ3JhbS5jb20vcC8ke2VkZ2Uubm9kZS5zaG9ydGNvZGV9L2AsXHJcbiAgICAgICAgICAgIGltYWdlVXJsOiBlZGdlLm5vZGUuZGlzcGxheV91cmwsXHJcbiAgICAgICAgICAgIHRpbWVzdGFtcDogZWRnZS5ub2RlLnRha2VuX2F0X3RpbWVzdGFtcCxcclxuICAgICAgICAgICAgaXNWaWRlbzogZWRnZS5ub2RlLmlzX3ZpZGVvLFxyXG4gICAgICAgICAgICB2aWRlb1VybDogZWRnZS5ub2RlLnZpZGVvX3VybCxcclxuICAgICAgICAgICAgdHlwZTogZWRnZS5ub2RlLmlzX3ZpZGVvID8gJ3ZpZGVvJyA6IFxyXG4gICAgICAgICAgICAgICAgICBlZGdlLm5vZGUuX190eXBlbmFtZSA9PT0gJ0dyYXBoU2lkZWNhcicgPyAnY2Fyb3VzZWwnIDogJ2ltYWdlJyxcclxuICAgICAgICAgICAgY2Fyb3VzZWxNZWRpYTogZWRnZS5ub2RlLmVkZ2Vfc2lkZWNhcl90b19jaGlsZHJlbj8uZWRnZXMubWFwKGNoaWxkID0+ICh7XHJcbiAgICAgICAgICAgICAgICB1cmw6IGNoaWxkLm5vZGUuZGlzcGxheV91cmwsXHJcbiAgICAgICAgICAgICAgICBpc1ZpZGVvOiBjaGlsZC5ub2RlLmlzX3ZpZGVvLFxyXG4gICAgICAgICAgICAgICAgdmlkZW9Vcmw6IGNoaWxkLm5vZGUudmlkZW9fdXJsXHJcbiAgICAgICAgICAgIH0pKSxcclxuICAgICAgICAgICAgbGlrZXM6IGVkZ2Uubm9kZS5lZGdlX21lZGlhX3ByZXZpZXdfbGlrZT8uY291bnQgfHwgMCxcclxuICAgICAgICAgICAgY29tbWVudHM6IGVkZ2Uubm9kZS5lZGdlX21lZGlhX3RvX2NvbW1lbnQ/LmNvdW50IHx8IDBcclxuICAgICAgICB9KSk7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGluIGdldEluc3RhZ3JhbURhdGE6JywgZXJyb3IpO1xyXG4gICAgICAgIHRocm93IGVycm9yO1xyXG4gICAgfVxyXG59Il0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFDQSxzQkFBdUQ7OztBQ0l2RCxlQUFzQixjQUFjLEtBQWEsU0FBNkM7QUFDMUYsTUFBSTtBQUNBLFlBQVEsSUFBSSxvQ0FBb0MsR0FBRztBQUVuRCxVQUFNLFdBQVcsT0FBTyxVQUFVLE9BQU8sUUFBUSxVQUFVLElBQUksUUFBUSxVQUFVO0FBQ2pGLFVBQU0sRUFBRSxJQUFJLElBQUksU0FBUyxVQUFVO0FBRW5DLFdBQU8sSUFBSSxRQUFRLENBQUMsU0FBUyxXQUFXO0FBQ3BDLFlBQU0sVUFBVSxJQUFJLFFBQVE7QUFB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QkFBMEIsS0FBSyxLQUFLLElBQUksQ0FBQztBQUdoRSxJQUFDLE9BQWUsa0JBQWtCO0FBQUEsTUFDOUIsU0FBUyxPQUFPLGFBQXFCO0FBQ2pDLFlBQUksQ0FBQyxLQUFLLFNBQVMsV0FBVztBQUMxQixnQkFBTSxJQUFJLE1BQU0saUVBQWlFO0FBQUEsUUFDckY7QUFDQSxZQUFJO0FBQ0EsaUJBQU8sTUFBTSxpQkFBaUIsVUFBVSxLQUFLLFNBQVMsU0FBUztBQUFBLFFBQ25FLFNBQVMsT0FBUDtBQUNFLGtCQUFRLE1BQU0sa0NBQWtDLEtBQUs7QUFDckQsZ0JBQU07QUFBQSxRQUNWO0FBQUEsTUFDSjtBQUFBLE1BQ0EsYUFBYSxNQUFNO0FBbEMvQjtBQW1DZ0IsZUFBTztBQUFBLFVBQ0gsY0FBYyxDQUFDLENBQUMsS0FBSyxTQUFTO0FBQUEsVUFDOUIsbUJBQWlCLFVBQUssU0FBUyxjQUFkLG1CQUF5QixXQUFVO0FBQUEsUUFDeEQ7QUFBQSxNQUNKO0FBQUEsSUFDSjtBQUFBLEVBQ0o7QUFBQSxFQUVBLFdBQVc7QUFDUCxXQUFRLE9BQWU7QUFBQSxFQUMzQjtBQUFBLEVBRUEsTUFBTSxlQUFlO0FBQ2pCLFNBQUssV0FBVyxPQUFPLE9BQU8sQ0FBQyxHQUFHLGtCQUFrQixNQUFNLEtBQUssU0FBUyxDQUFDO0FBQUEsRUFDN0U7QUFBQSxFQUVBLE1BQU0sZUFBZTtBQUNqQixVQUFNLEtBQUssU0FBUyxLQUFLLFFBQVE7QUFBQSxFQUNyQztBQUNKO0FBRUEsSUFBTSw0QkFBTixjQUF3QyxpQ0FBaUI7QUFBQSxFQUdyRCxZQUFZLEtBQVUsUUFBeUI7QUFDM0MsVUFBTSxLQUFLLE1BQU07QUFDakIsU0FBSyxTQUFTO0FBQUEsRUFDbEI7QUFBQSxFQUVBLFVBQWdCO0FBQ1osVUFBTSxFQUFFLFlBQVksSUFBSTtBQUN4QixnQkFBWSxNQUFNO0FBRWxCLFFBQUksd0JBQVEsV0FBVyxFQUNsQixRQUFRLHNCQUFzQixFQUM5QixRQUFRLDJCQUEyQixFQUNuQyxRQUFRLFVBQVEsS0FDWixlQUFlLHVCQUF1QixFQUN0QyxTQUFTLEtBQUssT0FBTyxTQUFTLFNBQVMsRUFDdkMsU0FBUyxPQUFPLFVBQVU7QUFDdkIsV0FBSyxPQUFPLFNBQVMsWUFBWTtBQUNqQyxZQUFNLEtBQUssT0FBTyxhQUFhO0FBQUEsSUFDbkMsQ0FBQyxDQUFDO0FBQUEsRUFDZDtBQUNKOyIsCiAgIm5hbWVzIjogWyJfYSIsICJfYiIsICJfYyJdCn0K
