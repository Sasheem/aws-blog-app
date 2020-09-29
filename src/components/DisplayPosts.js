import React, { Component } from 'react';
import { listPosts } from '../graphql/queries';
import { API, graphqlOperation } from 'aws-amplify';
import DeletePost from './DeletePost';
import EditPost from './EditPost';
import { onCreatePost } from '../graphql/subscriptions';

class DisplayPosts extends Component {
	state = {
		posts: [],
	};

	componentDidMount = async () => {
		this.getPosts();
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
	};

	componentWillUnmount = () => {
		this.createPostListener.unsubscribe();
	};

	getPosts = async () => {
		const result = await API.graphql(graphqlOperation(listPosts));
		this.setState({ posts: result.data.listPosts.items });
		console.dir(result.data.listPosts.items);
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
						<DeletePost />
						<EditPost />
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
