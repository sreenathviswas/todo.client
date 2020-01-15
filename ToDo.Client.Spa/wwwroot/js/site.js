// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.

const msalConfig = {
	//popUp: true,
	auth: {
		clientId: "b2027100-cc3f-4f65-8879-8aa29bff9204",
		authority: "https://login.microsoftonline.com/7ad4009f-0ead-4576-81ba-3ad93dccbc9f",
		validateAuthority: false,
		redirectUri: "https://localhost:5002",
	},
	cache: {
		cacheLocation: "localStorage",
		storeAuthStateInCookie: true
	}
};
clientApplication = new Msal.UserAgentApplication(msalConfig);

var request = {
	scopes: ['api://61c387ae-7147-4642-8deb-f2b13f88f0e2/.default']
}

$(document).ready(function () {
	getAllTodo();

	$('.add-items').submit(function (event) {
		event.preventDefault();

		var todo = $('#todo-list-item').val();

		if (todo) {
			clientApplication.acquireTokenSilent(request)
				.then(function (response) {
					createTodo(todo, response.accessToken);
				})
				.catch(err => {
					if (isReLoginError(err)) {
						clientApplication.acquireTokenPopup(request).then(
							function (response) {
								createTodo(todo, response.accessToken);
							}).catch(function (error) {
								console.log(error);
							});
					} else {
						console.log(err.errorMessage);
						clientApplication.loginPopup().then(function (token) {
							console.log(token);
						});
					}
				});
		}

	});

	$(document).on('change', '.checkbox', function () {
		if ($(this).attr('checked')) {
			$(this).removeAttr('checked');
		}
		else {
			$(this).attr('checked', 'checked');
		}

		$(this).parent().toggleClass('completed');

		localStorage.setItem('listItems', $('#list-items').html());
	});

	$(document).on('click', '.remove', function () {
		var id = $(this).data('id');
		var doneItem = $(this).parent();

		clientApplication.acquireTokenSilent(request)
			.then(function (response) {
				deleteTodo(id, doneItem, response.accessToken);
			})
			.catch(err => {
				if (isReLoginError(err)) {
					clientApplication.acquireTokenPopup(request).then(
						function (response) {
							deleteTodo(id, doneItem, response.accessToken);
						}).catch(function (error) {
							console.log(error);
						});
				} else {
					console.log(err.errorMessage);
					clientApplication.loginPopup().then(function (token) {
						console.log(token);
					});
				}
			});
	});

});

function isReLoginError(err) {
	return (err.name === "InteractionRequiredAuthError" || err.errorCode == "login_required" || err.errorCode == "consent_required");
}

function fetchAllTodo(accessToken) {
	$.ajax({
		url: "https://localhost:5001/api/todo",
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + accessToken,
		},
		type: "GET",
		dataType: 'json',
		success: function (data, textStatus, jqXHR) {
			for (var i = 0; i < data.length; i++) {
				var markup = `<li><input class='checkbox' type='checkbox' data-id='${data[i].id}'/>${data[i].content}<a class='remove' data-id='${data[i].id}'>x</a><hr></li>`;
				$('#list-items').prepend(markup);
				$('#todo-list-item').val("");
			}
		},
		error: function (jqXHR, textStatus, errorThrown) {

		}
	});
}

function getAllTodo() {
	clientApplication.acquireTokenSilent(request)
		.then(function (response) {
			fetchAllTodo(response.accessToken);
		})
		.catch(err => {
			if (isReLoginError(err)) {
				clientApplication.acquireTokenPopup(request).then(
					function (response) {
						fetchAllTodo(response.accessToken);
					}).catch(function (error) {
						console.log(error);
					});
			} else {
				console.log(err.errorMessage);
				clientApplication.loginPopup().then(function (token) {
				});
			}
		});
}

function createTodo(todo, accessToken) {
	$.ajax({
		url: "https://localhost:5001/api/todo",
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + accessToken,
		},
		type: "POST",
		data: JSON.stringify({
			content: todo
		}),
		dataType: 'json',
		success: function (data, textStatus, jqXHR) {
			var markup = `<li><input class='checkbox' type='checkbox' data-id='${data.id}'/>${data.content}<a class='remove' data-id='${data.id}'>x</a><hr></li>`;
			$('#list-items').prepend(markup);
			$('#todo-list-item').val("");
		},
		error: function (jqXHR, textStatus, errorThrown) {

		}
	});
}

function deleteTodo(id, doneItem, accessToken) {
	$.ajax({
		url: `https://localhost:5001/api/todo/${id}`,
		headers: {
			'Authorization': 'Bearer ' + accessToken,
		},
		type: "DELETE",
		success: function () {
			doneItem.remove();
		},
		error: function () {

		}
	});
}