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
    const response = await fetch(url, {
      method: options.method || "GET",
      headers: options.headers || {},
      credentials: "include",
      mode: "cors",
      redirect: "follow"
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Response received and parsed successfully");
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

// src/instagram.ts
async function getInstagramData(username, sessionId) {
  var _a, _b, _c;
  try {
    console.log("Starting Instagram data fetch for user:", username);
    const feedUrl = `https://www.instagram.com/${username}/?__a=1&__d=dis`;
    const headers = {
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Cookie": `sessionid=${sessionId}`,
      "X-IG-App-ID": "936619743392459",
      "X-Requested-With": "XMLHttpRequest",
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Dest": "empty",
      "Accept-Language": "en-US,en;q=0.9"
    };
    console.log("Fetching feed data...");
    const response = await electronFetch(feedUrl, {
      method: "GET",
      headers,
      timeout: 15e3
      // 15 second timeout
    });
    if (!((_c = (_b = (_a = response == null ? void 0 : response.graphql) == null ? void 0 : _a.user) == null ? void 0 : _b.edge_owner_to_timeline_media) == null ? void 0 : _c.edges)) {
      throw new Error("No feed data found in response");
    }
    const edges = response.graphql.user.edge_owner_to_timeline_media.edges;
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvZWxlY3Ryb24tZmV0Y2gudHMiLCAic3JjL2luc3RhZ3JhbS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gbWFpbi50c1xyXG5pbXBvcnQgeyBBcHAsIFBsdWdpbiwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZyB9IGZyb20gJ29ic2lkaWFuJztcclxuaW1wb3J0IHsgZ2V0SW5zdGFncmFtRGF0YSB9IGZyb20gJy4vc3JjL2luc3RhZ3JhbSc7XHJcblxyXG5pbnRlcmZhY2UgSW5zdGFncmFtVmlld2VyU2V0dGluZ3Mge1xyXG4gICAgc2Vzc2lvbklkOiBzdHJpbmc7XHJcbn1cclxuXHJcbmNvbnN0IERFRkFVTFRfU0VUVElOR1M6IEluc3RhZ3JhbVZpZXdlclNldHRpbmdzID0ge1xyXG4gICAgc2Vzc2lvbklkOiAnJ1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBJbnN0YWdyYW1WaWV3ZXIgZXh0ZW5kcyBQbHVnaW4ge1xyXG4gICAgc2V0dGluZ3M6IEluc3RhZ3JhbVZpZXdlclNldHRpbmdzO1xyXG5cclxuICAgIGFzeW5jIG9ubG9hZCgpIHtcclxuICAgICAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xyXG5cclxuICAgICAgICAvLyBBZGQgc2V0dGluZ3MgdGFiXHJcbiAgICAgICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBJbnN0YWdyYW1WaWV3ZXJTZXR0aW5nVGFiKHRoaXMuYXBwLCB0aGlzKSk7XHJcblxyXG4gICAgICAgIC8vIFJlZ2lzdGVyIHRoZSBJbnN0YWdyYW1WaWV3ZXIgZ2xvYmFsXHJcbiAgICAgICAgKHdpbmRvdyBhcyBhbnkpLkluc3RhZ3JhbVZpZXdlciA9IHtcclxuICAgICAgICAgICAgZ2V0RmVlZDogYXN5bmMgKHVzZXJuYW1lOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5zZXR0aW5ncy5zZXNzaW9uSWQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luc3RhZ3JhbSBzZXNzaW9uIElEIG5vdCBzZXQuIFBsZWFzZSBzZXQgaXQgaW4gcGx1Z2luIHNldHRpbmdzLicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgZ2V0SW5zdGFncmFtRGF0YSh1c2VybmFtZSwgdGhpcy5zZXR0aW5ncy5zZXNzaW9uSWQpO1xyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBmZXRjaGluZyBJbnN0YWdyYW0gZGF0YTonLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGdldFNldHRpbmdzOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGhhc1Nlc3Npb25JZDogISF0aGlzLnNldHRpbmdzLnNlc3Npb25JZCxcclxuICAgICAgICAgICAgICAgICAgICBzZXNzaW9uSWRMZW5ndGg6IHRoaXMuc2V0dGluZ3Muc2Vzc2lvbklkPy5sZW5ndGggfHwgMFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgb251bmxvYWQoKSB7XHJcbiAgICAgICAgZGVsZXRlICh3aW5kb3cgYXMgYW55KS5JbnN0YWdyYW1WaWV3ZXI7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgbG9hZFNldHRpbmdzKCkge1xyXG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX1NFVFRJTkdTLCBhd2FpdCB0aGlzLmxvYWREYXRhKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHNhdmVTZXR0aW5ncygpIHtcclxuICAgICAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBJbnN0YWdyYW1WaWV3ZXJTZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XHJcbiAgICBwbHVnaW46IEluc3RhZ3JhbVZpZXdlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBJbnN0YWdyYW1WaWV3ZXIpIHtcclxuICAgICAgICBzdXBlcihhcHAsIHBsdWdpbik7XHJcbiAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XHJcbiAgICB9XHJcblxyXG4gICAgZGlzcGxheSgpOiB2b2lkIHtcclxuICAgICAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xyXG4gICAgICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XHJcblxyXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZSgnSW5zdGFncmFtIFNlc3Npb24gSUQnKVxyXG4gICAgICAgICAgICAuc2V0RGVzYygnWW91ciBJbnN0YWdyYW0gc2Vzc2lvbiBJRCcpXHJcbiAgICAgICAgICAgIC5hZGRUZXh0KHRleHQgPT4gdGV4dFxyXG4gICAgICAgICAgICAgICAgLnNldFBsYWNlaG9sZGVyKCdFbnRlciB5b3VyIHNlc3Npb24gSUQnKVxyXG4gICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNlc3Npb25JZClcclxuICAgICAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zZXNzaW9uSWQgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuICAgIH1cclxufSIsICIvLyBzcmMvZWxlY3Ryb24tZmV0Y2gudHNcclxuaW1wb3J0IHsgSW5zdGFncmFtQVBJUmVzcG9uc2UgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbmRlY2xhcmUgY29uc3QgcmVxdWlyZTogYW55O1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVsZWN0cm9uRmV0Y2godXJsOiBzdHJpbmcsIG9wdGlvbnM6IGFueSk6IFByb21pc2U8SW5zdGFncmFtQVBJUmVzcG9uc2U+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ1N0YXJ0aW5nIGVsZWN0cm9uIGZldGNoIGZvciBVUkw6JywgdXJsKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBVc2UgcmVndWxhciBmZXRjaCBpbnN0ZWFkIG9mIGVsZWN0cm9uJ3MgbmV0IG1vZHVsZVxyXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XHJcbiAgICAgICAgICAgIG1ldGhvZDogb3B0aW9ucy5tZXRob2QgfHwgJ0dFVCcsXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IG9wdGlvbnMuaGVhZGVycyB8fCB7fSxcclxuICAgICAgICAgICAgY3JlZGVudGlhbHM6ICdpbmNsdWRlJyxcclxuICAgICAgICAgICAgbW9kZTogJ2NvcnMnLFxyXG4gICAgICAgICAgICByZWRpcmVjdDogJ2ZvbGxvdydcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEhUVFAgZXJyb3IhIHN0YXR1czogJHtyZXNwb25zZS5zdGF0dXN9YCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdSZXNwb25zZSByZWNlaXZlZCBhbmQgcGFyc2VkIHN1Y2Nlc3NmdWxseScpO1xyXG4gICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdGZXRjaCBlcnJvcjonLCBlcnJvcik7XHJcbiAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICB9XHJcbn0iLCAiLy8gc3JjL2luc3RhZ3JhbS50c1xyXG5pbXBvcnQgeyBJbnN0YWdyYW1Qb3N0IH0gZnJvbSAnLi90eXBlcyc7XHJcbmltcG9ydCB7IGVsZWN0cm9uRmV0Y2ggfSBmcm9tICcuL2VsZWN0cm9uLWZldGNoJztcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRJbnN0YWdyYW1EYXRhKHVzZXJuYW1lOiBzdHJpbmcsIHNlc3Npb25JZDogc3RyaW5nKTogUHJvbWlzZTxJbnN0YWdyYW1Qb3N0W10+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ1N0YXJ0aW5nIEluc3RhZ3JhbSBkYXRhIGZldGNoIGZvciB1c2VyOicsIHVzZXJuYW1lKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBVc2luZyB0aGUgYmFzaWMgZmVlZCBlbmRwb2ludFxyXG4gICAgICAgIGNvbnN0IGZlZWRVcmwgPSBgaHR0cHM6Ly93d3cuaW5zdGFncmFtLmNvbS8ke3VzZXJuYW1lfS8/X19hPTEmX19kPWRpc2A7XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc3QgaGVhZGVycyA9IHtcclxuICAgICAgICAgICAgJ0FjY2VwdCc6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuICAgICAgICAgICAgJ1VzZXItQWdlbnQnOiAnTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEyMC4wLjAuMCBTYWZhcmkvNTM3LjM2JyxcclxuICAgICAgICAgICAgJ0Nvb2tpZSc6IGBzZXNzaW9uaWQ9JHtzZXNzaW9uSWR9YCxcclxuICAgICAgICAgICAgJ1gtSUctQXBwLUlEJzogJzkzNjYxOTc0MzM5MjQ1OScsXHJcbiAgICAgICAgICAgICdYLVJlcXVlc3RlZC1XaXRoJzogJ1hNTEh0dHBSZXF1ZXN0JyxcclxuICAgICAgICAgICAgJ1NlYy1GZXRjaC1TaXRlJzogJ3NhbWUtb3JpZ2luJyxcclxuICAgICAgICAgICAgJ1NlYy1GZXRjaC1Nb2RlJzogJ2NvcnMnLFxyXG4gICAgICAgICAgICAnU2VjLUZldGNoLURlc3QnOiAnZW1wdHknLFxyXG4gICAgICAgICAgICAnQWNjZXB0LUxhbmd1YWdlJzogJ2VuLVVTLGVuO3E9MC45J1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKCdGZXRjaGluZyBmZWVkIGRhdGEuLi4nKTtcclxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGVsZWN0cm9uRmV0Y2goZmVlZFVybCwge1xyXG4gICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxyXG4gICAgICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxyXG4gICAgICAgICAgICB0aW1lb3V0OiAxNTAwMCAvLyAxNSBzZWNvbmQgdGltZW91dFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAoIXJlc3BvbnNlPy5ncmFwaHFsPy51c2VyPy5lZGdlX293bmVyX3RvX3RpbWVsaW5lX21lZGlhPy5lZGdlcykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGZlZWQgZGF0YSBmb3VuZCBpbiByZXNwb25zZScpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgZWRnZXMgPSByZXNwb25zZS5ncmFwaHFsLnVzZXIuZWRnZV9vd25lcl90b190aW1lbGluZV9tZWRpYS5lZGdlcztcclxuICAgICAgICBjb25zb2xlLmxvZyhgRm91bmQgJHtlZGdlcy5sZW5ndGh9IHBvc3RzYCk7XHJcblxyXG4gICAgICAgIHJldHVybiBlZGdlcy5tYXAoZWRnZSA9PiAoe1xyXG4gICAgICAgICAgICBpZDogZWRnZS5ub2RlLmlkLFxyXG4gICAgICAgICAgICBzaG9ydGNvZGU6IGVkZ2Uubm9kZS5zaG9ydGNvZGUsXHJcbiAgICAgICAgICAgIGNhcHRpb246IGVkZ2Uubm9kZS5lZGdlX21lZGlhX3RvX2NhcHRpb24uZWRnZXNbMF0/Lm5vZGUudGV4dCB8fCAnJyxcclxuICAgICAgICAgICAgdXJsOiBgaHR0cHM6Ly93d3cuaW5zdGFncmFtLmNvbS9wLyR7ZWRnZS5ub2RlLnNob3J0Y29kZX0vYCxcclxuICAgICAgICAgICAgaW1hZ2VVcmw6IGVkZ2Uubm9kZS5kaXNwbGF5X3VybCxcclxuICAgICAgICAgICAgdGltZXN0YW1wOiBlZGdlLm5vZGUudGFrZW5fYXRfdGltZXN0YW1wLFxyXG4gICAgICAgICAgICBpc1ZpZGVvOiBlZGdlLm5vZGUuaXNfdmlkZW8sXHJcbiAgICAgICAgICAgIHZpZGVvVXJsOiBlZGdlLm5vZGUudmlkZW9fdXJsLFxyXG4gICAgICAgICAgICB0eXBlOiBlZGdlLm5vZGUuaXNfdmlkZW8gPyAndmlkZW8nIDogXHJcbiAgICAgICAgICAgICAgICAgIGVkZ2Uubm9kZS5fX3R5cGVuYW1lID09PSAnR3JhcGhTaWRlY2FyJyA/ICdjYXJvdXNlbCcgOiAnaW1hZ2UnLFxyXG4gICAgICAgICAgICBjYXJvdXNlbE1lZGlhOiBlZGdlLm5vZGUuZWRnZV9zaWRlY2FyX3RvX2NoaWxkcmVuPy5lZGdlcy5tYXAoY2hpbGQgPT4gKHtcclxuICAgICAgICAgICAgICAgIHVybDogY2hpbGQubm9kZS5kaXNwbGF5X3VybCxcclxuICAgICAgICAgICAgICAgIGlzVmlkZW86IGNoaWxkLm5vZGUuaXNfdmlkZW8sXHJcbiAgICAgICAgICAgICAgICB2aWRlb1VybDogY2hpbGQubm9kZS52aWRlb191cmxcclxuICAgICAgICAgICAgfSkpLFxyXG4gICAgICAgICAgICBsaWtlczogZWRnZS5ub2RlLmVkZ2VfbWVkaWFfcHJldmlld19saWtlPy5jb3VudCB8fCAwLFxyXG4gICAgICAgICAgICBjb21tZW50czogZWRnZS5ub2RlLmVkZ2VfbWVkaWFfdG9fY29tbWVudD8uY291bnQgfHwgMFxyXG4gICAgICAgIH0pKTtcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgaW4gZ2V0SW5zdGFncmFtRGF0YTonLCBlcnJvcik7XHJcbiAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICB9XHJcbn0iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUNBLHNCQUF1RDs7O0FDSXZELGVBQXNCLGNBQWMsS0FBYSxTQUE2QztBQUMxRixNQUFJO0FBQ0EsWUFBUSxJQUFJLG9DQUFvQyxHQUFHO0FBR25ELFVBQU0sV0FBVyxNQUFNLE1BQU0sS0FBSztBQUFBLE1BQzlCLFFBQVEsUUFBUSxVQUFVO0FBQUEsTUFDMUIsU0FBUyxRQUFRLFdBQVcsQ0FBQztBQUFBLE1BQzdCLGFBQWE7QUFBQSxNQUNiLE1BQU07QUFBQSxNQUNOLFVBQVU7QUFBQSxJQUNkLENBQUM7QUFFRCxRQUFJLENBQUMsU0FBUyxJQUFJO0FBQ2QsWUFBTSxJQUFJLE1BQU0sdUJBQXVCLFNBQVMsUUFBUTtBQUFBLElBQzVEO0FBRUEsVUFBTSxPQUFPLE1BQU0sU0FBUyxLQUFLO0FBQ2pDLFlBQVEsSUFBSSwyQ0FBMkM7QUFDdkQsV0FBTztBQUFBLEVBQ1gsU0FBUyxPQUFQO0FBQ0UsWUFBUSxNQUFNLGdCQUFnQixLQUFLO0FBQ25DLFVBQU07QUFBQSxFQUNWO0FBQ0o7OztBQ3pCQSxlQUFzQixpQkFBaUIsVUFBa0IsV0FBNkM7QUFKdEc7QUFLSSxNQUFJO0FBQ0EsWUFBUSxJQUFJLDJDQUEyQyxRQUFRO0FBRy9ELFVBQU0sVUFBVSw2QkFBNkI7QUFFN0MsVUFBTSxVQUFVO0FBQUEsTUFDWixVQUFVO0FBQUEsTUFDVixjQUFjO0FBQUEsTUFDZCxVQUFVLGFBQWE7QUFBQSxNQUN2QixlQUFlO0FBQUEsTUFDZixvQkFBb0I7QUFBQSxNQUNwQixrQkFBa0I7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
