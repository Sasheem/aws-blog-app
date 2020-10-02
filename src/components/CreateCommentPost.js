import React, { Component } from 'react';
import { API, Auth, graphqlOperation } from 'aws-amplify';
import { createComment } from '../graphql/mutations';

class CreateCommentPost extends Component {
	state = {
		commentOwnerId: '',
		commentOwnerUsername: '',
		content: '',
	};

	componentDidMount = async () => {
		await Auth.currentUserInfo().then((user) => {
			this.setState({
				commentOwnerId: user.attributes.sub,
				commentOwnerUsername: user.username,
			});
		});
	};

	handleChangeContent = (event) =>
		this.setState({ content: event.target.value });

	handleAddComment = async (event) => {
		event.preventDefault();
		const { commentOwnerId, commentOwnerUsername, content } = this.state;
		const input = {
			commentPostId: this.props.postId,
			commentOwnerId,
			commentOwnerUsername,
			content,
			createdAt: new Date().toISOString(),
		};
		await API.graphql(graphqlOperation(createComment, { input }));

		this.setState({ content: '' });
	};

	render() {
		return (
			<div>
				<form className='add-comment' onSubmit={this.handleAddComment}>
					<textarea
						type='text'
						name='content'
						rows='4'
						cols='40'
						placeholder='Add your comment...'
						value={this.state.content}
						onChange={this.handleChangeContent}
						required
					/>
					<input
						className='btn'
						type='submit'
						style={{ fontSize: '19px' }}
						value='Add Comment'
					/>
				</form>
			</div>
		);
	}
}

export default CreateCommentPost;
