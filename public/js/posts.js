export const Posts = {
    async loadFeed(type = 'for-you') {
        const feed = document.querySelector('.main-feed');
        if (!feed) return;

        try {
            const response = await fetch(`/api/posts/feed?type=${type}`);
            const posts = await response.json();

            feed.innerHTML = `
                <div class="feed-header">
                    <div class="feed-tabs">
                        <span class="feed-tab ${type === 'for-you' ? 'active' : ''}" onclick="Posts.loadFeed('for-you')">For you</span>
                        <span class="feed-tab ${type === 'following' ? 'active' : ''}" onclick="Posts.loadFeed('following')">Following</span>
                        <span class="feed-tab ${type === 'boosted' ? 'active' : ''}" onclick="Posts.loadFeed('boosted')">Boosted</span>
                    </div>
                </div>
                
                <div class="post-box">
                    <div class="avatar"></div>
                    <div class="post-input-area">
                        <textarea placeholder="What's happening?" id="quickPost"></textarea>
                        <div class="post-attachments">
                            <i class="fas fa-image"></i>
                            <i class="fas fa-video"></i>
                            <i class="fas fa-file"></i>
                        </div>
                    </div>
                </div>
                
                <div id="postsContainer">
                    ${posts.map(post => this.renderPost(post)).join('')}
                </div>
            `;

            // Add quick post handler
            document.getElementById('quickPost')?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.createQuickPost(e.target.value);
                }
            });

        } catch (error) {
            console.error('Failed to load feed:', error);
        }
    },

    renderPost(post) {
        const isBoosted = post.boosted || false;
        const isVerified = post.user.verified || false;
        const isAd = post.isAd || false;

        return `
            <div class="post-card ${isBoosted ? 'boosted' : ''} ${isAd ? 'ad' : ''}" data-post-id="${post.id}">
                <div class="post-avatar" style="background-image: url('${post.user.avatar}')"></div>
                <div class="post-content">
                    <div class="post-header">
                        <span class="post-author">${post.user.name}</span>
                        <span class="post-username">@${post.user.username}</span>
                        ${isVerified ? '<span class="post-badge">💠</span>' : ''}
                        ${isBoosted ? '<span class="boost-badge">🚀 Boosted</span>' : ''}
                        ${isAd ? '<span class="ad-label">Ad</span>' : ''}
                        <span class="post-time">· ${this.timeAgo(post.createdAt)}</span>
                    </div>
                    
                    <div class="post-body">
                        ${post.text}
                    </div>
                    
                    ${post.media ? `
                        <div class="post-media">
                            ${post.media.type === 'image' ? `<img src="${post.media.url}" alt="Post media">` : ''}
                            ${post.media.type === 'video' ? `<video src="${post.media.url}" controls></video>` : ''}
                        </div>
                    ` : ''}
                    
                    <div class="post-stats">
                        <span><i class="far fa-heart"></i> ${post.likes}</span>
                        <span><i class="far fa-comment"></i> ${post.comments}</span>
                        <span><i class="far fa-bookmark"></i> ${post.saves}</span>
                    </div>
                    
                    <div class="post-actions">
                        <span class="like-btn ${post.liked ? 'liked' : ''}" onclick="Posts.like('${post.id}')">
                            <i class="fa${post.liked ? 's' : 'r'} fa-heart"></i>
                            <span>Like</span>
                        </span>
                        <span onclick="Posts.showComments('${post.id}')">
                            <i class="far fa-comment"></i>
                            <span>Comment</span>
                        </span>
                        <span onclick="Posts.share('${post.id}')">
                            <i class="far fa-paper-plane"></i>
                            <span>Share</span>
                        </span>
                        <span onclick="Posts.save('${post.id}')">
                            <i class="fa${post.saved ? 's' : 'r'} fa-bookmark"></i>
                            <span>Save</span>
                        </span>
                    </div>
                </div>
            </div>
        `;
    },

    async like(postId) {
        try {
            const response = await fetch(`/api/posts/${postId}/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('pm_token')}` }
            });
            
            if (response.ok) {
                // Update UI
                const likeBtn = document.querySelector(`[data-post-id="${postId}"] .like-btn`);
                likeBtn.classList.toggle('liked');
                const icon = likeBtn.querySelector('i');
                icon.classList.toggle('far');
                icon.classList.toggle('fas');
            }
        } catch (error) {
            console.error('Failed to like post:', error);
        }
    },

    async showComments(postId) {
        const post = document.querySelector(`[data-post-id="${postId}"]`);
        let commentsSection = post.querySelector('.comment-section');
        
        if (commentsSection) {
            commentsSection.remove();
            return;
        }

        try {
            const response = await fetch(`/api/posts/${postId}/comments`);
            const comments = await response.json();

            commentsSection = document.createElement('div');
            commentsSection.className = 'comment-section';
            commentsSection.innerHTML = `
                <div class="comment-input">
                    <div class="avatar avatar-small"></div>
                    <input type="text" placeholder="Write a comment..." id="commentInput-${postId}">
                    <button onclick="Posts.addComment('${postId}')">Post</button>
                </div>
                <div class="comments-list">
                    ${comments.map(comment => this.renderComment(comment)).join('')}
                </div>
            `;

            post.appendChild(commentsSection);
        } catch (error) {
            console.error('Failed to load comments:', error);
        }
    },

    renderComment(comment) {
        return `
            <div class="comment" data-comment-id="${comment.id}">
                <div class="comment-avatar"></div>
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author">${comment.user.name}</span>
                        <span class="post-username">@${comment.user.username}</span>
                        <span class="post-time">· ${this.timeAgo(comment.createdAt)}</span>
                    </div>
                    <div class="comment-text">${comment.text}</div>
                    <div class="comment-actions">
                        <span onclick="Posts.likeComment('${comment.id}')">
                            <i class="far fa-heart"></i> ${comment.likes}
                        </span>
                        <span onclick="Posts.replyToComment('${comment.id}')">
                            <i class="far fa-comment"></i> Reply
                        </span>
                    </div>
                    ${comment.replies ? comment.replies.map(reply => `
                        <div class="comment-reply">
                            ${this.renderComment(reply)}
                        </div>
                    `).join('') : ''}
                </div>
            </div>
        `;
    },

    async addComment(postId) {
        const input = document.getElementById(`commentInput-${postId}`);
        const text = input.value.trim();
        
        if (!text) return;

        try {
            const response = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('pm_token')}`
                },
                body: JSON.stringify({ text })
            });

            if (response.ok) {
                input.value = '';
                this.showComments(postId); // Refresh comments
            }
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
    },

    async boost(postId) {
        const user = JSON.parse(localStorage.getItem('pm_user'));
        
        // Check if user has enough SA
        if (user.saBalance < 100) {
            alert('Insufficient SA balance. Minimum 100 SA required for boost.');
            return;
        }

        if (!confirm('Boost this post for 100 SA? It will be promoted for 48 hours.')) {
            return;
        }

        try {
            const response = await fetch(`/api/posts/${postId}/boost`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('pm_token')}`
                },
                body: JSON.stringify({ duration: 48 })
            });

            if (response.ok) {
                alert('Post boosted successfully! It will appear in Boosted feed for 48 hours.');
                
                // Update SA balance
                user.saBalance -= 100;
                localStorage.setItem('pm_user', JSON.stringify(user));
                
                // Distribute SA
                await Auth.creditSA(user.id, 100, 'post boost');
            }
        } catch (error) {
            console.error('Failed to boost post:', error);
        }
    },

    timeAgo(timestamp) {
        const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + 'y';
        
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + 'mo';
        
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + 'd';
        
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + 'h';
        
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + 'm';
        
        return Math.floor(seconds) + 's';
    }
};