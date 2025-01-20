// main.ts
import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { getInstagramData } from './src/instagram';
import { InstagramPost } from './src/types';

interface InstagramViewerSettings {
    sessionId: string;
}

const DEFAULT_SETTINGS: InstagramViewerSettings = {
    sessionId: ''
}

export default class InstagramViewer extends Plugin {
    settings: InstagramViewerSettings;

    async onload() {
        await this.loadSettings();

        // Add settings tab
        this.addSettingTab(new InstagramViewerSettingTab(this.app, this));

        // Register the InstagramViewer global
        (window as any).InstagramViewer = {
            getFeed: async (username: string) => {
                if (!this.settings.sessionId) {
                    throw new Error('Instagram session ID not set. Please set it in plugin settings.');
                }
                try {
                    return await getInstagramData(username, this.settings.sessionId);
                } catch (error) {
                    console.error('Error fetching Instagram data:', error);
                    throw error;
                }
            },
            // Expose settings for checking in DataviewJS
            getSettings: () => {
                return {
                    hasSessionId: !!this.settings.sessionId,
                    sessionIdLength: this.settings.sessionId?.length || 0
                };
            }
        };
    }

    onunload() {
        delete (window as any).InstagramViewer;
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class InstagramViewerSettingTab extends PluginSettingTab {
    plugin: InstagramViewer;

    constructor(app: App, plugin: InstagramViewer) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('Instagram Session ID')
            .setDesc('Your Instagram session ID')
            .addText(text => text
                .setPlaceholder('Enter your session ID')
                .setValue(this.plugin.settings.sessionId)
                .onChange(async (value) => {
                    this.plugin.settings.sessionId = value;
                    await this.plugin.saveSettings();
                }));
    }
}