import React, { Component } from 'react';
import { listPosts } from '../graphql/queries';
import { API, Auth, graphqlOperation } from 'aws-amplify';
import DeletePost from './DeletePost';
import EditPost from './EditPost';
import {
	onCreatePost,
	onDeletePost,
	onUpdatePost,
	onCreateComment,
	onCreateLike,
} from '../graphql/subscriptions';
import { createLike } from '../graphql/mutations';
import CreateCommentPost from './CreateCommentPost';
import CommentPost from './CommentPost';
import { FaThumbsUp } from 'react-icons/fa';

class DisplayPosts extends Component {
	state = {
		ownerId: '',
		ownerUsername: '',
		isHovering: false,
		posts: [],
	};

	componentDidMount = async () => {
		this.getPosts();

		await Auth.currentUserInfo().then((user) => {
			this.setState({
				ownerId: user.attributes.sub,
				ownerUsername: user.username,
			});
		});
		this.createPostListener = API.graphql(
			graphqlOperation(onCreatePost)
		).subscribe({
			next: (postData) => {
				const newPost = postData.value.data.onCreatePost;
				const prevPosts = this.state.posts.filter(
					(post) => post.id !== newPost.id
				);
				const updatedPosts = [newPost, ...prevPosts];
				this.setState({ posts: updatedPosts });
			},
		});

		this.deletePostListener = API.graphql(
			graphqlOperation(onDeletePost)
		).subscribe({
			next: (postData) => {
				const deletedPost = postData.value.data.onDeletePost;
				const updatedPosts = this.state.posts.filter(
					(post) => post.id !== deletedPost.id
				);
				this.setState({ posts: updatedPosts });
			},
		});

		this.updatePostListener = API.graphql(
			graphqlOperation(onUpdatePost)
		).subscribe({
			next: (postData) => {
				const { posts } = this.state;
				const updatePost = postData.value.data.onUpdatePost;
				const index = posts.findIndex((post) => post.id === updatePost.id);
				const updatePosts = [
					...posts.slice(0, index),
					updatePost,
					...posts.slice(index + 1),
				];

				this.setState({ posts: updatePosts });
			},
		});

		this.createPostCommentListener = API.graphql(
			graphqlOperation(onCreateComment)
		).subscribe({
			next: (commentData) => {
				const createdComment = commentData.value.data.onCreateComment;
				let posts = [...this.state.posts];
				for (let post of posts) {
					if (createdComment.post.id === post.id) {
						post.comments.items.push(createdComment);
					}
				}
				this.setState({ posts });
			},
		});

		this.createPostLikeListener = API.graphql(
			graphqlOperation(onCreateLike)
		).subscribe({
			next: (postData) => {
				const createdLike = postData.value.data.onCreateLike;
				let posts = [...this.state.posts];
				for (let post of posts) {
					if (createdLike.post.id === post.id) {
						post.likes.items.push(createdLike);
					}
				}

				this.setState({ posts });
			},
		});
	};

	componentWillUnmount = () => {
		this.createPostListener.unsubscribe();
		this.deletePostListener.unsubscribe();
		this.updatePostListener.unsubscribe();
		this.createPostCommentListener.unsubscribe();
		this.createPostLikeListener.unsubscribe();
	};

	getPosts = async () => {
		const result = await API.graphql(graphqlOperation(listPosts));
		this.setState({ posts: result.data.listPosts.items });
		console.dir(result.data.listPosts.items);
	};

	// ensures people can't like their own post
	likedPost = (postId) => {
		for (let post of this.state.posts) {
			// check if this is the same post
			if (post.id === postId) {
				// check if postOwner in question is the logged in user
				if (post.postOwnerId === this.state.ownerId) return true;
				// not then loop thru likes
				for (let like of post.likes.items) {
					if (like.likeOwnerId === this.state.ownerId) return true;
				}
			}
		}
		return false;
	};

	handleLike = async (postId) => {
		const input = {
			numberLikes: 1,
			likeOwnerId: this.state.ownerId,
			likeOwnerUsername: this.state.ownerUsername,
			likePostId: postId,
		};

		try {
			const result = await API.graphql(graphqlOperation(createLike, { input }));
			console.log(`Liked: ${result.data}`);
			console.dir(result.data);
		} catch (error) {
			console.error(`Error handleLike: ${error.message}`);
		}
	};

	render() {
		const { posts } = this.state;
		return posts.map((post) => {
			return (
				<div className='posts' style={rowStyle} key={post.id}>
					<h2>{post.postTitle}</h2>

					<span style={{ fontStyle: 'italic', color: '#0ca5e297' }}>
						{'Wrote By: '}
						{post.postOwnerUsername}
						{' on '}
						<time style={{ fontStyle: 'inherit' }}>
							{' '}
							{new Date(post.createdAt).toDateString()}
						</time>
					</span>

					<p>{post.postBody}</p>
					<br />

					<span>
						<DeletePost data={post} />
						<EditPost {...post} />

						<span>
							<p onClick={() => this.handleLike(post.id)}>
								<FaThumbsUp />
								{post.likes.items.length}
							</p>
						</span>
					</span>

					<span>
						<CreateCommentPost postId={post.id} />
						{post.comments.items.length > 0 && (
							<span style={{ fontSize: '19px', color: 'grey' }}>
								Comments:{' '}
								{post.comments.items.map((comment, index) => (
									<CommentPost key={index} commentData={comment} />
								))}
							</span>
						)}
					</span>
				</div>
			);
		});
	}
}

const rowStyle = {
	background: '#f4f4f4',
	padding: '10px',
	border: '1px #ccc dotted',
	margin: '14px',
};

export default DisplayPosts;
