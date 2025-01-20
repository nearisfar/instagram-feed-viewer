# Instagram Feed Viewer for Obsidian

This plugin allows you to view Instagram posts directly in your Obsidian notes using DataviewJS.

## Prerequisites

- [Obsidian](https://obsidian.md/) version 0.15.0 or higher
- [Dataview](https://github.com/blacksmithgu/obsidian-dataview) plugin installed
- An Instagram account

## Installation

### Manual Installation

1. Create a new folder called `instagram-feed-viewer` in your vault's `.obsidian/plugins/` directory
2. Copy all plugin files into the new folder
3. Enable the plugin in Obsidian's settings under "Community Plugins"

### Configuration

1. Go to Settings → Community Plugins → Instagram Feed Viewer
2. Enter your Instagram session ID:
   - Log into Instagram in your web browser
   - Open Developer Tools (F12)
   - Go to Application/Storage → Cookies → www.instagram.com
   - Find and copy the value of the "sessionid" cookie
   - Paste it into the plugin settings

## Usage

Create a new note and add the following DataviewJS code block:

```javascript
// Example DataviewJS code to display Instagram posts
const USERNAME = "rinrinprn28_"; // Replace with desired Instagram username
const POST_LIMIT = 10;

// Function to format date
const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Function to display posts
const displayPosts = async () => {
    try {
        const posts = await dv.api.getInstagramPosts(USERNAME, POST_LIMIT);
        
        dv.header(2, `📸 Latest Posts from @${USERNAME}`);
        
        const container = dv.container;
        container.classList.add('instagram-viewer-container');
        
        posts.forEach(post => {
            const postDiv = container.createEl('div', {
                cls: 'instagram-post-card'
            });

            // Post header with timestamp
            const header = postDiv.createEl('div', {
                cls: 'instagram-post-header'
            });
            header.createEl('span', {
                cls: 'instagram-post-timestamp',
                text: formatDate(post.timestamp)
            });

            // Post image
            if (post.imageUrl) {
                postDiv.createEl('img', {
                    cls: 'instagram-post-image',
                    attr: {
                        src: post.imageUrl,
                        alt: 'Instagram post'
                    }
                });
            }

            // Post content
            const content = postDiv.createEl('div', {
                cls: 'instagram-post-content'
            });

            // Caption
            if (post.caption) {
                content.createEl('div', {
                    cls: 'instagram-post-caption',
                    text: post.caption
                });
            }

            // Link to post
            content.createEl('a', {
                cls: 'instagram-post-link',
                text: 'View on Instagram',
                attr: {
                    href: post.url,
                    target: '_blank',
                    rel: 'noopener noreferrer'
                }
            });
        });
    } catch (error) {
        dv.el('div', error.message, {
            cls: 'instagram-error'
        });
    }
};

// Create refresh button
dv.container.createEl('button', {
    cls: 'instagram-refresh-button',
    text: '🔄 Refresh Posts'
}).addEventListener('click', () => displayPosts());

// Initial display
displayPosts();