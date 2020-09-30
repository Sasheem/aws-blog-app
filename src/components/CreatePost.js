import { API, graphqlOperation, Auth } from 'aws-amplify';
import React, { Component } from 'react';
import { createPost } from '../graphql/mutations';

class CreatePost extends Component {
	state = {
		postOwnerId: '',
		postOwnerUsername: '',
		postTitle: '',
		postBody: '',
	};

	componentDidMount = async () => {
		await Auth.currentUserInfo().then((user) => {
			console.log(`User: ${user.username}`);
			console.dir(user);
			this.setState({
				postOwnerId: user.attributes.sub,
				postOwnerUsername: user.username,
			});
		});
	};

	handleAddPost = async (event) => {
		event.preventDefault();
		const { postOwnerId, postOwnerUsername, postTitle, postBody } = this.state;
		const input = {
			postOwnerId,
			postOwnerUsername,
			postTitle,
			postBody,
			createdAt: new Date().toISOString(),
		};
		await API.graphql(graphqlOperation(createPost, { input }));
		this.setState({ postTitle: '', postBody: '' });
	};

	handleChangePost = (event) =>
		this.setState({ [event.target.name]: event.target.value });

	render() {
		return (
			<form className='add-post' onSubmit={this.handleAddPost}>
				<input
					style={{ fontSize: '19px' }}
					type='text'
					placeholder='Title'
					onChange={this.handleChangePost}
					value={this.state.postTitle}
					name='postTitle'
					required
				/>
				<textarea
					type='text'
					name='postBody'
					rows='3'
					columns='40'
					placeholder='New Blog Post'
					onChange={this.handleChangePost}
					value={this.state.postBody}
					required
				/>
				<input className='btn' style={{ fontSize: '19px' }} type='submit' />
			</form>
		);
	}
}

export default CreatePost;
