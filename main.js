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

// src/instagram.ts
async function getInstagramData(username, sessionId) {
  var _a, _b, _c;
  try {
    const proxyUrl = "https://api.codetabs.com/v1/proxy?quest=";
    const instagramUrl = encodeURIComponent(`https://www.instagram.com/${username}/?__a=1&__d=dis`);
    console.log("Fetching Instagram data...");
    const response = await fetch(`${proxyUrl}${instagramUrl}`, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Cookie": `sessionid=${sessionId}`,
        "X-IG-App-ID": "936619743392459"
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`);
    }
    const data = await response.json();
    if (!((_c = (_b = (_a = data.graphql) == null ? void 0 : _a.user) == null ? void 0 : _b.edge_owner_to_timeline_media) == null ? void 0 : _c.edges)) {
      console.error("Invalid data structure:", data);
      throw new Error("No user data found");
    }
    const edges = data.graphql.user.edge_owner_to_timeline_media.edges;
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
    console.error("Error fetching Instagram data:", error);
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
      // Expose settings for checking in DataviewJS
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJzcmMvaW5zdGFncmFtLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvLyBtYWluLnRzXHJcbmltcG9ydCB7IEFwcCwgUGx1Z2luLCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nIH0gZnJvbSAnb2JzaWRpYW4nO1xyXG5pbXBvcnQgeyBnZXRJbnN0YWdyYW1EYXRhIH0gZnJvbSAnLi9zcmMvaW5zdGFncmFtJztcclxuaW1wb3J0IHsgSW5zdGFncmFtUG9zdCB9IGZyb20gJy4vc3JjL3R5cGVzJztcclxuXHJcbmludGVyZmFjZSBJbnN0YWdyYW1WaWV3ZXJTZXR0aW5ncyB7XHJcbiAgICBzZXNzaW9uSWQ6IHN0cmluZztcclxufVxyXG5cclxuY29uc3QgREVGQVVMVF9TRVRUSU5HUzogSW5zdGFncmFtVmlld2VyU2V0dGluZ3MgPSB7XHJcbiAgICBzZXNzaW9uSWQ6ICcnXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEluc3RhZ3JhbVZpZXdlciBleHRlbmRzIFBsdWdpbiB7XHJcbiAgICBzZXR0aW5nczogSW5zdGFncmFtVmlld2VyU2V0dGluZ3M7XHJcblxyXG4gICAgYXN5bmMgb25sb2FkKCkge1xyXG4gICAgICAgIGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XHJcblxyXG4gICAgICAgIC8vIEFkZCBzZXR0aW5ncyB0YWJcclxuICAgICAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IEluc3RhZ3JhbVZpZXdlclNldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcclxuXHJcbiAgICAgICAgLy8gUmVnaXN0ZXIgdGhlIEluc3RhZ3JhbVZpZXdlciBnbG9iYWxcclxuICAgICAgICAod2luZG93IGFzIGFueSkuSW5zdGFncmFtVmlld2VyID0ge1xyXG4gICAgICAgICAgICBnZXRGZWVkOiBhc3luYyAodXNlcm5hbWU6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLnNldHRpbmdzLnNlc3Npb25JZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW5zdGFncmFtIHNlc3Npb24gSUQgbm90IHNldC4gUGxlYXNlIHNldCBpdCBpbiBwbHVnaW4gc2V0dGluZ3MuJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCBnZXRJbnN0YWdyYW1EYXRhKHVzZXJuYW1lLCB0aGlzLnNldHRpbmdzLnNlc3Npb25JZCk7XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGZldGNoaW5nIEluc3RhZ3JhbSBkYXRhOicsIGVycm9yKTtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLy8gRXhwb3NlIHNldHRpbmdzIGZvciBjaGVja2luZyBpbiBEYXRhdmlld0pTXHJcbiAgICAgICAgICAgIGdldFNldHRpbmdzOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGhhc1Nlc3Npb25JZDogISF0aGlzLnNldHRpbmdzLnNlc3Npb25JZCxcclxuICAgICAgICAgICAgICAgICAgICBzZXNzaW9uSWRMZW5ndGg6IHRoaXMuc2V0dGluZ3Muc2Vzc2lvbklkPy5sZW5ndGggfHwgMFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgb251bmxvYWQoKSB7XHJcbiAgICAgICAgZGVsZXRlICh3aW5kb3cgYXMgYW55KS5JbnN0YWdyYW1WaWV3ZXI7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgbG9hZFNldHRpbmdzKCkge1xyXG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX1NFVFRJTkdTLCBhd2FpdCB0aGlzLmxvYWREYXRhKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHNhdmVTZXR0aW5ncygpIHtcclxuICAgICAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBJbnN0YWdyYW1WaWV3ZXJTZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XHJcbiAgICBwbHVnaW46IEluc3RhZ3JhbVZpZXdlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBJbnN0YWdyYW1WaWV3ZXIpIHtcclxuICAgICAgICBzdXBlcihhcHAsIHBsdWdpbik7XHJcbiAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XHJcbiAgICB9XHJcblxyXG4gICAgZGlzcGxheSgpOiB2b2lkIHtcclxuICAgICAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xyXG4gICAgICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XHJcblxyXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZSgnSW5zdGFncmFtIFNlc3Npb24gSUQnKVxyXG4gICAgICAgICAgICAuc2V0RGVzYygnWW91ciBJbnN0YWdyYW0gc2Vzc2lvbiBJRCcpXHJcbiAgICAgICAgICAgIC5hZGRUZXh0KHRleHQgPT4gdGV4dFxyXG4gICAgICAgICAgICAgICAgLnNldFBsYWNlaG9sZGVyKCdFbnRlciB5b3VyIHNlc3Npb24gSUQnKVxyXG4gICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNlc3Npb25JZClcclxuICAgICAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zZXNzaW9uSWQgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuICAgIH1cclxufSIsICIvLyBzcmMvaW5zdGFncmFtLnRzXHJcbmltcG9ydCB7IEluc3RhZ3JhbVBvc3QgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRJbnN0YWdyYW1EYXRhKHVzZXJuYW1lOiBzdHJpbmcsIHNlc3Npb25JZDogc3RyaW5nKTogUHJvbWlzZTxJbnN0YWdyYW1Qb3N0W10+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgLy8gVXNpbmcgYSBDT1JTIHByb3h5XHJcbiAgICAgICAgY29uc3QgcHJveHlVcmwgPSAnaHR0cHM6Ly9hcGkuY29kZXRhYnMuY29tL3YxL3Byb3h5P3F1ZXN0PSc7XHJcbiAgICAgICAgY29uc3QgaW5zdGFncmFtVXJsID0gZW5jb2RlVVJJQ29tcG9uZW50KGBodHRwczovL3d3dy5pbnN0YWdyYW0uY29tLyR7dXNlcm5hbWV9Lz9fX2E9MSZfX2Q9ZGlzYCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc29sZS5sb2coJ0ZldGNoaW5nIEluc3RhZ3JhbSBkYXRhLi4uJyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChgJHtwcm94eVVybH0ke2luc3RhZ3JhbVVybH1gLCB7XHJcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgICdBY2NlcHQnOiAnYXBwbGljYXRpb24vanNvbicsXHJcbiAgICAgICAgICAgICAgICAnVXNlci1BZ2VudCc6ICdNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIwLjAuMC4wIFNhZmFyaS81MzcuMzYnLFxyXG4gICAgICAgICAgICAgICAgJ0Nvb2tpZSc6IGBzZXNzaW9uaWQ9JHtzZXNzaW9uSWR9YCxcclxuICAgICAgICAgICAgICAgICdYLUlHLUFwcC1JRCc6ICc5MzY2MTk3NDMzOTI0NTknXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBmZXRjaCBkYXRhOiAke3Jlc3BvbnNlLnN0YXR1c31gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKCFkYXRhLmdyYXBocWw/LnVzZXI/LmVkZ2Vfb3duZXJfdG9fdGltZWxpbmVfbWVkaWE/LmVkZ2VzKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ludmFsaWQgZGF0YSBzdHJ1Y3R1cmU6JywgZGF0YSk7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gdXNlciBkYXRhIGZvdW5kJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBlZGdlcyA9IGRhdGEuZ3JhcGhxbC51c2VyLmVkZ2Vfb3duZXJfdG9fdGltZWxpbmVfbWVkaWEuZWRnZXM7XHJcblxyXG4gICAgICAgIHJldHVybiBlZGdlcy5tYXAoZWRnZSA9PiAoe1xyXG4gICAgICAgICAgICBpZDogZWRnZS5ub2RlLmlkLFxyXG4gICAgICAgICAgICBzaG9ydGNvZGU6IGVkZ2Uubm9kZS5zaG9ydGNvZGUsXHJcbiAgICAgICAgICAgIGNhcHRpb246IGVkZ2Uubm9kZS5lZGdlX21lZGlhX3RvX2NhcHRpb24uZWRnZXNbMF0/Lm5vZGUudGV4dCB8fCAnJyxcclxuICAgICAgICAgICAgdXJsOiBgaHR0cHM6Ly93d3cuaW5zdGFncmFtLmNvbS9wLyR7ZWRnZS5ub2RlLnNob3J0Y29kZX0vYCxcclxuICAgICAgICAgICAgaW1hZ2VVcmw6IGVkZ2Uubm9kZS5kaXNwbGF5X3VybCxcclxuICAgICAgICAgICAgdGltZXN0YW1wOiBlZGdlLm5vZGUudGFrZW5fYXRfdGltZXN0YW1wLFxyXG4gICAgICAgICAgICBpc1ZpZGVvOiBlZGdlLm5vZGUuaXNfdmlkZW8sXHJcbiAgICAgICAgICAgIHZpZGVvVXJsOiBlZGdlLm5vZGUudmlkZW9fdXJsLFxyXG4gICAgICAgICAgICB0eXBlOiBlZGdlLm5vZGUuaXNfdmlkZW8gPyAndmlkZW8nIDogXHJcbiAgICAgICAgICAgICAgICAgIGVkZ2Uubm9kZS5fX3R5cGVuYW1lID09PSAnR3JhcGhTaWRlY2FyJyA/ICdjYXJvdXNlbCcgOiAnaW1hZ2UnLFxyXG4gICAgICAgICAgICBjYXJvdXNlbE1lZGlhOiBlZGdlLm5vZGUuZWRnZV9zaWRlY2FyX3RvX2NoaWxkcmVuPy5lZGdlcy5tYXAoY2hpbGQgPT4gKHtcclxuICAgICAgICAgICAgICAgIHVybDogY2hpbGQubm9kZS5kaXNwbGF5X3VybCxcclxuICAgICAgICAgICAgICAgIGlzVmlkZW86IGNoaWxkLm5vZGUuaXNfdmlkZW8sXHJcbiAgICAgICAgICAgICAgICB2aWRlb1VybDogY2hpbGQubm9kZS52aWRlb191cmxcclxuICAgICAgICAgICAgfSkpLFxyXG4gICAgICAgICAgICBsaWtlczogZWRnZS5ub2RlLmVkZ2VfbWVkaWFfcHJldmlld19saWtlPy5jb3VudCB8fCAwLFxyXG4gICAgICAgICAgICBjb21tZW50czogZWRnZS5ub2RlLmVkZ2VfbWVkaWFfdG9fY29tbWVudD8uY291bnQgfHwgMFxyXG4gICAgICAgIH0pKTtcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZmV0Y2hpbmcgSW5zdGFncmFtIGRhdGE6JywgZXJyb3IpO1xyXG4gICAgICAgIHRocm93IGVycm9yO1xyXG4gICAgfVxyXG59Il0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFDQSxzQkFBdUQ7OztBQ0V2RCxlQUFzQixpQkFBaUIsVUFBa0IsV0FBNkM7QUFIdEc7QUFJSSxNQUFJO0FBRUEsVUFBTSxXQUFXO0FBQ2pCLFVBQU0sZUFBZSxtQkFBbUIsNkJBQTZCLHlCQUF5QjtBQUU5RixZQUFRLElBQUksNEJBQTRCO0FBRXhDLFVBQU0sV0FBVyxNQUFNLE1BQU0sR0FBRyxXQUFXLGdCQUFnQjtBQUFBLE1BQ3ZELFNBQVM7QUFBQSxRQUNMLFVBQVU7QUFBQSxRQUNWLGNBQWM7QUFBQSxRQUNkLFVBQVUsYUFBYTtBQUFBLFFBQ3ZCLGVBQWU7QUFBQSxNQUNuQjtBQUFBLElBQ0osQ0FBQztBQUVELFFBQUksQ0FBQyxTQUFTLElBQUk7QUFDZCxZQUFNLElBQUksTUFBTSx5QkFBeUIsU0FBUyxRQUFRO0FBQUEsSUFDOUQ7QUFFQSxVQUFNLE9BQU8sTUFBTSxTQUFTLEtBQUs7QUFFakMsUUFBSSxHQUFDLHNCQUFLLFlBQUwsbUJBQWMsU0FBZCxtQkFBb0IsaUNBQXBCLG1CQUFrRCxRQUFPO0FBQzFELGNBQVEsTUFBTSwyQkFBMkIsSUFBSTtBQUM3QyxZQUFNLElBQUksTUFBTSxvQkFBb0I7QUFBQSxJQUN4QztBQUVBLFVBQU0sUUFBUSxLQUFLLFFBQVEsS0FBSyw2QkFBNkI7QUFFN0QsV0FBTyxNQUFNLElBQUksVUFBSztBQWpDOUIsVUFBQUEsS0FBQUMsS0FBQUMsS0FBQTtBQWlDa0M7QUFBQSxRQUN0QixJQUFJLEtBQUssS0FBSztBQUFBLFFBQ2QsV0FBVyxLQUFLLEtBQUs7QUFBQSxRQUNyQixXQUFTRixNQUFBLEtBQUssS0FBSyxzQkFBc0IsTUFBTSxDQUFDLE1BQXZDLGdCQUFBQSxJQUEwQyxLQUFLLFNBQVE7QUFBQSxRQUNoRSxLQUFLLCtCQUErQixLQUFLLEtBQUs7QUFBQSxRQUM5QyxVQUFVLEtBQUssS0FBSztBQUFBLFFBQ3BCLFdBQVcsS0FBSyxLQUFLO0FBQUEsUUFDckIsU0FBUyxLQUFLLEtBQUs7QUFBQSxRQUNuQixVQUFVLEtBQUssS0FBSztBQUFBLFFBQ3BCLE1BQU0sS0FBSyxLQUFLLFdBQVcsVUFDckIsS0FBSyxLQUFLLGVBQWUsaUJBQWlCLGFBQWE7QUFBQSxRQUM3RCxnQkFBZUMsTUFBQSxLQUFLLEtBQUssNkJBQVYsZ0JBQUFBLElBQW9DLE1BQU0sSUFBSSxZQUFVO0FBQUEsVUFDbkUsS0FBSyxNQUFNLEtBQUs7QUFBQSxVQUNoQixTQUFTLE1BQU0sS0FBSztBQUFBLFVBQ3BCLFVBQVUsTUFBTSxLQUFLO0FBQUEsUUFDekI7QUFBQSxRQUNBLFNBQU9DLE1BQUEsS0FBSyxLQUFLLDRCQUFWLGdCQUFBQSxJQUFtQyxVQUFTO0FBQUEsUUFDbkQsWUFBVSxVQUFLLEtBQUssMEJBQVYsbUJBQWlDLFVBQVM7QUFBQSxNQUN4RDtBQUFBLEtBQUU7QUFBQSxFQUNOLFNBQVMsT0FBUDtBQUNFLFlBQVEsTUFBTSxrQ0FBa0MsS0FBSztBQUNyRCxVQUFNO0FBQUEsRUFDVjtBQUNKOzs7QUQvQ0EsSUFBTSxtQkFBNEM7QUFBQSxFQUM5QyxXQUFXO0FBQ2Y7QUFFQSxJQUFxQixrQkFBckIsY0FBNkMsdUJBQU87QUFBQSxFQUdoRCxNQUFNLFNBQVM7QUFDWCxVQUFNLEtBQUssYUFBYTtBQUd4QixTQUFLLGNBQWMsSUFBSSwwQkFBMEIsS0FBSyxLQUFLLElBQUksQ0FBQztBQUdoRSxJQUFDLE9BQWUsa0JBQWtCO0FBQUEsTUFDOUIsU0FBUyxPQUFPLGFBQXFCO0FBQ2pDLFlBQUksQ0FBQyxLQUFLLFNBQVMsV0FBVztBQUMxQixnQkFBTSxJQUFJLE1BQU0saUVBQWlFO0FBQUEsUUFDckY7QUFDQSxZQUFJO0FBQ0EsaUJBQU8sTUFBTSxpQkFBaUIsVUFBVSxLQUFLLFNBQVMsU0FBUztBQUFBLFFBQ25FLFNBQVMsT0FBUDtBQUNFLGtCQUFRLE1BQU0sa0NBQWtDLEtBQUs7QUFDckQsZ0JBQU07QUFBQSxRQUNWO0FBQUEsTUFDSjtBQUFBO0FBQUEsTUFFQSxhQUFhLE1BQU07QUFwQy9CO0FBcUNnQixlQUFPO0FBQUEsVUFDSCxjQUFjLENBQUMsQ0FBQyxLQUFLLFNBQVM7QUFBQSxVQUM5QixtQkFBaUIsVUFBSyxTQUFTLGNBQWQsbUJBQXlCLFdBQVU7QUFBQSxRQUN4RDtBQUFBLE1BQ0o7QUFBQSxJQUNKO0FBQUEsRUFDSjtBQUFBLEVBRUEsV0FBVztBQUNQLFdBQVEsT0FBZTtBQUFBLEVBQzNCO0FBQUEsRUFFQSxNQUFNLGVBQWU7QUFDakIsU0FBSyxXQUFXLE9BQU8sT0FBTyxDQUFDLEdBQUcsa0JBQWtCLE1BQU0sS0FBSyxTQUFTLENBQUM7QUFBQSxFQUM3RTtBQUFBLEVBRUEsTUFBTSxlQUFlO0FBQ2pCLFVBQU0sS0FBSyxTQUFTLEtBQUssUUFBUTtBQUFBLEVBQ3JDO0FBQ0o7QUFFQSxJQUFNLDRCQUFOLGNBQXdDLGlDQUFpQjtBQUFBLEVBR3JELFlBQVksS0FBVSxRQUF5QjtBQUMzQyxVQUFNLEtBQUssTUFBTTtBQUNqQixTQUFLLFNBQVM7QUFBQSxFQUNsQjtBQUFBLEVBRUEsVUFBZ0I7QUFDWixVQUFNLEVBQUUsWUFBWSxJQUFJO0FBQ3hCLGdCQUFZLE1BQU07QUFFbEIsUUFBSSx3QkFBUSxXQUFXLEVBQ2xCLFFBQVEsc0JBQXNCLEVBQzlCLFFBQVEsMkJBQTJCLEVBQ25DLFFBQVEsVUFBUSxLQUNaLGVBQWUsdUJBQXVCLEVBQ3RDLFNBQVMsS0FBSyxPQUFPLFNBQVMsU0FBUyxFQUN2QyxTQUFTLE9BQU8sVUFBVTtBQUN2QixXQUFLLE9BQU8sU0FBUyxZQUFZO0FBQ2pDLFlBQU0sS0FBSyxPQUFPLGFBQWE7QUFBQSxJQUNuQyxDQUFDLENBQUM7QUFBQSxFQUNkO0FBQ0o7IiwKICAibmFtZXMiOiBbIl9hIiwgIl9iIiwgIl9jIl0KfQo=
