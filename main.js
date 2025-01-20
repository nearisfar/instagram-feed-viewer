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
      let responseData = Buffer.from([]);
      let responseTimeout;
      responseTimeout = setTimeout(() => {
        request.abort();
        reject(new Error("Request timed out after 30 seconds"));
      }, 3e4);
      request.on("response", (response) => {
        console.log(`Response status: ${response.statusCode}`);
        response.on("data", (chunk) => {
          responseData = Buffer.concat([responseData, chunk]);
        });
        response.on("end", () => {
          clearTimeout(responseTimeout);
          try {
            const jsonData = JSON.parse(responseData.toString());
            resolve(jsonData);
          } catch (error) {
            console.error("Failed to parse response:", error);
            reject(error);
          }
        });
        response.on("error", (error) => {
          clearTimeout(responseTimeout);
          console.error("Response error:", error);
          reject(error);
        });
      });
      request.on("error", (error) => {
        clearTimeout(responseTimeout);
        console.error("Request error:", error);
        reject(error);
      });
      request.on("abort", () => {
        clearTimeout(responseTimeout);
        reject(new Error("Request was aborted"));
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
    const queryHash = "69cba40317214236af40e7efa697781d";
    const variables = JSON.stringify({
      username,
      first: 12
      // Number of posts to fetch
    });
    const url = `https://www.instagram.com/graphql/query/?query_hash=${queryHash}&variables=${encodeURIComponent(variables)}`;
    const headers = {
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Cookie": `sessionid=${sessionId}`,
      "X-IG-App-ID": "936619743392459",
      "X-IG-WWW-Claim": "0",
      "X-Requested-With": "XMLHttpRequest",
      "Referer": `https://www.instagram.com/${username}/`,
      "Accept-Language": "en-US,en;q=0.9"
    };
    console.log("Making request to Instagram GraphQL API...");
    const response = await electronFetch(url, {
      method: "GET",
      headers
    });
    if (!((_c = (_b = (_a = response == null ? void 0 : response.data) == null ? void 0 : _a.user) == null ? void 0 : _b.edge_owner_to_timeline_media) == null ? void 0 : _c.edges)) {
      throw new Error("No user data found in response");
    }
    const edges = response.data.user.edge_owner_to_timeline_media.edges;
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvZWxlY3Ryb24tZmV0Y2gudHMiLCAic3JjL2luc3RhZ3JhbS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gbWFpbi50c1xyXG5pbXBvcnQgeyBBcHAsIFBsdWdpbiwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZyB9IGZyb20gJ29ic2lkaWFuJztcclxuaW1wb3J0IHsgZ2V0SW5zdGFncmFtRGF0YSB9IGZyb20gJy4vc3JjL2luc3RhZ3JhbSc7XHJcblxyXG5pbnRlcmZhY2UgSW5zdGFncmFtVmlld2VyU2V0dGluZ3Mge1xyXG4gICAgc2Vzc2lvbklkOiBzdHJpbmc7XHJcbn1cclxuXHJcbmNvbnN0IERFRkFVTFRfU0VUVElOR1M6IEluc3RhZ3JhbVZpZXdlclNldHRpbmdzID0ge1xyXG4gICAgc2Vzc2lvbklkOiAnJ1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBJbnN0YWdyYW1WaWV3ZXIgZXh0ZW5kcyBQbHVnaW4ge1xyXG4gICAgc2V0dGluZ3M6IEluc3RhZ3JhbVZpZXdlclNldHRpbmdzO1xyXG5cclxuICAgIGFzeW5jIG9ubG9hZCgpIHtcclxuICAgICAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xyXG5cclxuICAgICAgICAvLyBBZGQgc2V0dGluZ3MgdGFiXHJcbiAgICAgICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBJbnN0YWdyYW1WaWV3ZXJTZXR0aW5nVGFiKHRoaXMuYXBwLCB0aGlzKSk7XHJcblxyXG4gICAgICAgIC8vIFJlZ2lzdGVyIHRoZSBJbnN0YWdyYW1WaWV3ZXIgZ2xvYmFsXHJcbiAgICAgICAgKHdpbmRvdyBhcyBhbnkpLkluc3RhZ3JhbVZpZXdlciA9IHtcclxuICAgICAgICAgICAgZ2V0RmVlZDogYXN5bmMgKHVzZXJuYW1lOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5zZXR0aW5ncy5zZXNzaW9uSWQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luc3RhZ3JhbSBzZXNzaW9uIElEIG5vdCBzZXQuIFBsZWFzZSBzZXQgaXQgaW4gcGx1Z2luIHNldHRpbmdzLicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgZ2V0SW5zdGFncmFtRGF0YSh1c2VybmFtZSwgdGhpcy5zZXR0aW5ncy5zZXNzaW9uSWQpO1xyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBmZXRjaGluZyBJbnN0YWdyYW0gZGF0YTonLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGdldFNldHRpbmdzOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGhhc1Nlc3Npb25JZDogISF0aGlzLnNldHRpbmdzLnNlc3Npb25JZCxcclxuICAgICAgICAgICAgICAgICAgICBzZXNzaW9uSWRMZW5ndGg6IHRoaXMuc2V0dGluZ3Muc2Vzc2lvbklkPy5sZW5ndGggfHwgMFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgb251bmxvYWQoKSB7XHJcbiAgICAgICAgZGVsZXRlICh3aW5kb3cgYXMgYW55KS5JbnN0YWdyYW1WaWV3ZXI7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgbG9hZFNldHRpbmdzKCkge1xyXG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX1NFVFRJTkdTLCBhd2FpdCB0aGlzLmxvYWREYXRhKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHNhdmVTZXR0aW5ncygpIHtcclxuICAgICAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBJbnN0YWdyYW1WaWV3ZXJTZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XHJcbiAgICBwbHVnaW46IEluc3RhZ3JhbVZpZXdlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBJbnN0YWdyYW1WaWV3ZXIpIHtcclxuICAgICAgICBzdXBlcihhcHAsIHBsdWdpbik7XHJcbiAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XHJcbiAgICB9XHJcblxyXG4gICAgZGlzcGxheSgpOiB2b2lkIHtcclxuICAgICAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xyXG4gICAgICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XHJcblxyXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZSgnSW5zdGFncmFtIFNlc3Npb24gSUQnKVxyXG4gICAgICAgICAgICAuc2V0RGVzYygnWW91ciBJbnN0YWdyYW0gc2Vzc2lvbiBJRCcpXHJcbiAgICAgICAgICAgIC5hZGRUZXh0KHRleHQgPT4gdGV4dFxyXG4gICAgICAgICAgICAgICAgLnNldFBsYWNlaG9sZGVyKCdFbnRlciB5b3VyIHNlc3Npb24gSUQnKVxyXG4gICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNlc3Npb25JZClcclxuICAgICAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zZXNzaW9uSWQgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuICAgIH1cclxufSIsICIvLyBzcmMvZWxlY3Ryb24tZmV0Y2gudHNcclxuaW1wb3J0IHsgSW5zdGFncmFtQVBJUmVzcG9uc2UgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbmRlY2xhcmUgY29uc3QgcmVxdWlyZTogYW55O1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVsZWN0cm9uRmV0Y2godXJsOiBzdHJpbmcsIG9wdGlvbnM6IGFueSk6IFByb21pc2U8SW5zdGFncmFtQVBJUmVzcG9uc2U+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ1N0YXJ0aW5nIGVsZWN0cm9uIGZldGNoIGZvciBVUkw6JywgdXJsKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBHZXQgZWxlY3Ryb24gaW4gYSB3YXkgdGhhdCB3b3JrcyBpbiBPYnNpZGlhblxyXG4gICAgICAgIGNvbnN0IGVsZWN0cm9uID0gd2luZG93LnJlcXVpcmUgPyB3aW5kb3cucmVxdWlyZSgnZWxlY3Ryb24nKSA6IHJlcXVpcmUoJ2VsZWN0cm9uJyk7XHJcbiAgICAgICAgY29uc3QgeyBuZXQgfSA9IGVsZWN0cm9uLnJlbW90ZSB8fCBlbGVjdHJvbjtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IG5ldC5yZXF1ZXN0KHtcclxuICAgICAgICAgICAgICAgIG1ldGhvZDogb3B0aW9ucy5tZXRob2QgfHwgJ0dFVCcsXHJcbiAgICAgICAgICAgICAgICB1cmw6IHVybCxcclxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IG9wdGlvbnMuaGVhZGVycyB8fCB7fSxcclxuICAgICAgICAgICAgICAgIHByb3RvY29sOiAnaHR0cHM6JyxcclxuICAgICAgICAgICAgICAgIHJlZGlyZWN0OiAnZm9sbG93J1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGxldCByZXNwb25zZURhdGEgPSBCdWZmZXIuZnJvbShbXSk7XHJcbiAgICAgICAgICAgIGxldCByZXNwb25zZVRpbWVvdXQ6IE5vZGVKUy5UaW1lb3V0O1xyXG5cclxuICAgICAgICAgICAgLy8gU2V0IGEgMzAtc2Vjb25kIHRpbWVvdXRcclxuICAgICAgICAgICAgcmVzcG9uc2VUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0LmFib3J0KCk7XHJcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKCdSZXF1ZXN0IHRpbWVkIG91dCBhZnRlciAzMCBzZWNvbmRzJykpO1xyXG4gICAgICAgICAgICB9LCAzMDAwMCk7XHJcblxyXG4gICAgICAgICAgICByZXF1ZXN0Lm9uKCdyZXNwb25zZScsIChyZXNwb25zZTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgUmVzcG9uc2Ugc3RhdHVzOiAke3Jlc3BvbnNlLnN0YXR1c0NvZGV9YCk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLm9uKCdkYXRhJywgKGNodW5rOiBCdWZmZXIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZURhdGEgPSBCdWZmZXIuY29uY2F0KFtyZXNwb25zZURhdGEsIGNodW5rXSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXNwb25zZS5vbignZW5kJywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChyZXNwb25zZVRpbWVvdXQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGpzb25EYXRhID0gSlNPTi5wYXJzZShyZXNwb25zZURhdGEudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoanNvbkRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBwYXJzZSByZXNwb25zZTonLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2Uub24oJ2Vycm9yJywgKGVycm9yOiBFcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChyZXNwb25zZVRpbWVvdXQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1Jlc3BvbnNlIGVycm9yOicsIGVycm9yKTtcclxuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcmVxdWVzdC5vbignZXJyb3InLCAoZXJyb3I6IEVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQocmVzcG9uc2VUaW1lb3V0KTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1JlcXVlc3QgZXJyb3I6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXF1ZXN0Lm9uKCdhYm9ydCcsICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChyZXNwb25zZVRpbWVvdXQpO1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcignUmVxdWVzdCB3YXMgYWJvcnRlZCcpKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBTZW5kIHRoZSByZXF1ZXN0XHJcbiAgICAgICAgICAgIHJlcXVlc3QuZW5kKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0VsZWN0cm9uIGZldGNoIGVycm9yOicsIGVycm9yKTtcclxuICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgIH1cclxufSIsICIvLyBzcmMvaW5zdGFncmFtLnRzXHJcbmltcG9ydCB7IEluc3RhZ3JhbVBvc3QgfSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IHsgZWxlY3Ryb25GZXRjaCB9IGZyb20gJy4vZWxlY3Ryb24tZmV0Y2gnO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEluc3RhZ3JhbURhdGEodXNlcm5hbWU6IHN0cmluZywgc2Vzc2lvbklkOiBzdHJpbmcpOiBQcm9taXNlPEluc3RhZ3JhbVBvc3RbXT4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zb2xlLmxvZygnU3RhcnRpbmcgSW5zdGFncmFtIGRhdGEgZmV0Y2ggZm9yIHVzZXI6JywgdXNlcm5hbWUpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFVzaW5nIHRoZSBJbnN0YWdyYW0gR3JhcGhRTCBBUEkgZW5kcG9pbnRcclxuICAgICAgICBjb25zdCBxdWVyeUhhc2ggPSAnNjljYmE0MDMxNzIxNDIzNmFmNDBlN2VmYTY5Nzc4MWQnOyAvLyBJbnN0YWdyYW0ncyBHcmFwaFFMIHF1ZXJ5IGhhc2ggZm9yIHVzZXIgbWVkaWFcclxuICAgICAgICBjb25zdCB2YXJpYWJsZXMgPSBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgIHVzZXJuYW1lOiB1c2VybmFtZSxcclxuICAgICAgICAgICAgZmlyc3Q6IDEyICAvLyBOdW1iZXIgb2YgcG9zdHMgdG8gZmV0Y2hcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgY29uc3QgdXJsID0gYGh0dHBzOi8vd3d3Lmluc3RhZ3JhbS5jb20vZ3JhcGhxbC9xdWVyeS8/cXVlcnlfaGFzaD0ke3F1ZXJ5SGFzaH0mdmFyaWFibGVzPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHZhcmlhYmxlcyl9YDtcclxuICAgICAgICBcclxuICAgICAgICBjb25zdCBoZWFkZXJzID0ge1xyXG4gICAgICAgICAgICAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICAgICAnVXNlci1BZ2VudCc6ICdNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIwLjAuMC4wIFNhZmFyaS81MzcuMzYnLFxyXG4gICAgICAgICAgICAnQ29va2llJzogYHNlc3Npb25pZD0ke3Nlc3Npb25JZH1gLFxyXG4gICAgICAgICAgICAnWC1JRy1BcHAtSUQnOiAnOTM2NjE5NzQzMzkyNDU5JyxcclxuICAgICAgICAgICAgJ1gtSUctV1dXLUNsYWltJzogJzAnLFxyXG4gICAgICAgICAgICAnWC1SZXF1ZXN0ZWQtV2l0aCc6ICdYTUxIdHRwUmVxdWVzdCcsXHJcbiAgICAgICAgICAgICdSZWZlcmVyJzogYGh0dHBzOi8vd3d3Lmluc3RhZ3JhbS5jb20vJHt1c2VybmFtZX0vYCxcclxuICAgICAgICAgICAgJ0FjY2VwdC1MYW5ndWFnZSc6ICdlbi1VUyxlbjtxPTAuOSdcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBjb25zb2xlLmxvZygnTWFraW5nIHJlcXVlc3QgdG8gSW5zdGFncmFtIEdyYXBoUUwgQVBJLi4uJyk7XHJcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBlbGVjdHJvbkZldGNoKHVybCwge1xyXG4gICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxyXG4gICAgICAgICAgICBoZWFkZXJzOiBoZWFkZXJzXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmICghcmVzcG9uc2U/LmRhdGE/LnVzZXI/LmVkZ2Vfb3duZXJfdG9fdGltZWxpbmVfbWVkaWE/LmVkZ2VzKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gdXNlciBkYXRhIGZvdW5kIGluIHJlc3BvbnNlJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBlZGdlcyA9IHJlc3BvbnNlLmRhdGEudXNlci5lZGdlX293bmVyX3RvX3RpbWVsaW5lX21lZGlhLmVkZ2VzO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBGb3VuZCAke2VkZ2VzLmxlbmd0aH0gcG9zdHNgKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGVkZ2VzLm1hcChlZGdlID0+ICh7XHJcbiAgICAgICAgICAgIGlkOiBlZGdlLm5vZGUuaWQsXHJcbiAgICAgICAgICAgIHNob3J0Y29kZTogZWRnZS5ub2RlLnNob3J0Y29kZSxcclxuICAgICAgICAgICAgY2FwdGlvbjogZWRnZS5ub2RlLmVkZ2VfbWVkaWFfdG9fY2FwdGlvbi5lZGdlc1swXT8ubm9kZS50ZXh0IHx8ICcnLFxyXG4gICAgICAgICAgICB1cmw6IGBodHRwczovL3d3dy5pbnN0YWdyYW0uY29tL3AvJHtlZGdlLm5vZGUuc2hvcnRjb2RlfS9gLFxyXG4gICAgICAgICAgICBpbWFnZVVybDogZWRnZS5ub2RlLmRpc3BsYXlfdXJsLFxyXG4gICAgICAgICAgICB0aW1lc3RhbXA6IGVkZ2Uubm9kZS50YWtlbl9hdF90aW1lc3RhbXAsXHJcbiAgICAgICAgICAgIGlzVmlkZW86IGVkZ2Uubm9kZS5pc192aWRlbyxcclxuICAgICAgICAgICAgdmlkZW9Vcmw6IGVkZ2Uubm9kZS52aWRlb191cmwsXHJcbiAgICAgICAgICAgIHR5cGU6IGVkZ2Uubm9kZS5pc192aWRlbyA/ICd2aWRlbycgOiBcclxuICAgICAgICAgICAgICAgICAgZWRnZS5ub2RlLl9fdHlwZW5hbWUgPT09ICdHcmFwaFNpZGVjYXInID8gJ2Nhcm91c2VsJyA6ICdpbWFnZScsXHJcbiAgICAgICAgICAgIGNhcm91c2VsTWVkaWE6IGVkZ2Uubm9kZS5lZGdlX3NpZGVjYXJfdG9fY2hpbGRyZW4/LmVkZ2VzLm1hcChjaGlsZCA9PiAoe1xyXG4gICAgICAgICAgICAgICAgdXJsOiBjaGlsZC5ub2RlLmRpc3BsYXlfdXJsLFxyXG4gICAgICAgICAgICAgICAgaXNWaWRlbzogY2hpbGQubm9kZS5pc192aWRlbyxcclxuICAgICAgICAgICAgICAgIHZpZGVvVXJsOiBjaGlsZC5ub2RlLnZpZGVvX3VybFxyXG4gICAgICAgICAgICB9KSksXHJcbiAgICAgICAgICAgIGxpa2VzOiBlZGdlLm5vZGUuZWRnZV9tZWRpYV9wcmV2aWV3X2xpa2U/LmNvdW50IHx8IDAsXHJcbiAgICAgICAgICAgIGNvbW1lbnRzOiBlZGdlLm5vZGUuZWRnZV9tZWRpYV90b19jb21tZW50Py5jb3VudCB8fCAwXHJcbiAgICAgICAgfSkpO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBpbiBnZXRJbnN0YWdyYW1EYXRhOicsIGVycm9yKTtcclxuICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgIH1cclxufSJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQ0Esc0JBQXVEOzs7QUNJdkQsZUFBc0IsY0FBYyxLQUFhLFNBQTZDO0FBQzFGLE1BQUk7QUFDQSxZQUFRLElBQUksb0NBQW9DLEdBQUc7QUFHbkQsVUFBTSxXQUFXLE9BQU8sVUFBVSxPQUFPLFFBQVEsVUFBVSxJQUFJLFFBQVEsVUFBVTtBQUNqRixVQUFNLEVBQUUsSUFBSSxJQUFJLFNBQVMsVUFBVTtBQUVuQyxXQUFPLElBQUksUUFBUSxDQUFDLFNBQVMsV0FBVztBQUNwQyxZQUFNLFVBQVUsSUFBSSxRQUFRO0FBQUEsUUFDeEIsUUFBUSxRQUFRLFVBQVU7QUFBQSxRQUMxQjtBQUFBLFFBQ0EsU0FBUyxRQUFRLFdBQVcsQ0FBQztBQUFBLFFBQzdCLFVBQVU7QUFBQSxRQUNWLFVBQVU7QUFBQSxNQUNkLENBQUM7QUFFRCxVQUFJLGVB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
