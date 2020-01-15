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
			getToken(request).then(tokenResponse => {
				createTodo(todo, tokenResponse.accessToken);
			});
		}
	});

	$(document).on('change', '.checkbox', function () {
		var elm = $(this);
		var todo = {};
		todo.id = elm.data('id');
		todo.content = elm.parent().find('label').text();
		todo.isCompleted = !elm.attr('checked');

		getToken(request).then(tokenResponse => {
			updateTodo(todo, elm, tokenResponse.accessToken);
		});
	});

	$(document).on('click', '.remove', function () {
		var id = $(this).data('id');
		var doneItem = $(this).parent();

		getToken(request).then(tokenResponse => {
			deleteTodo(id, doneItem, tokenResponse.accessToken);
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
				var markup = `<li class='${data[i].isCompleted ? 'completed' : ''}'><input class='checkbox' type='checkbox' data-id='${data[i].id}' ${data[i].isCompleted ? 'checked' : ''}/><label>${data[i].content}</label><a class='remove' data-id='${data[i].id}'>x</a><hr></li>`;
				$('#list-items').prepend(markup);
				$('#todo-list-item').val("");
			}
		},
		error: function (jqXHR, textStatus, errorThrown) {

		}
	});
}

function getAllTodo() {
	getToken(request).then(tokenResponse => {
		fetchAllTodo(tokenResponse.accessToken);
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
			var markup = `< li class='${data.isCompleted ? 'completed' : ''}' > <input class='checkbox' type='checkbox' data-id='${data.id}' ${data.isCompleted ? 'checked' : ''}/><label>${data.content}</label><a class='remove' data-id='${data.id}'>x</a><hr></li>`;
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

function updateTodo(todo, elem, accessToken) {
	$.ajax({
		url: `https://localhost:5001/api/todo/${todo.id}`,
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + accessToken,
		},
		type: "PUT",
		data: JSON.stringify(todo),
		dataType: 'json',
		success: function (data, textStatus, jqXHR) {
			if (elem.attr('checked')) {
				elem.removeAttr('checked');
			}
			else {
				elem.attr('checked', 'checked');
			}

			elem.parent().toggleClass('completed');
		},
		error: function (jqXHR, textStatus, errorThrown) {

		}
	});
}

function getToken(tokenRequest) {
	return clientApplication.acquireTokenSilent(tokenRequest).catch(function (error) {
		if (isReLoginError(err)) {
			return clientApplication.acquireTokenPopup(tokenRequest).then(function (tokenResponse) {
			}).catch(function (error) {
				logMessage("Failed token acquisition", error);
			});
		}
		else {
			console.log(err.errorMessage);
			clientApplication.loginPopup().then(function (token) {
				return getToken(request);
			});
		}
	});
}