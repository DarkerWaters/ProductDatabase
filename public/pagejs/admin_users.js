// https://firebase.google.com/docs/auth/web/manage-users#get_the_currently_signed-in_user
// need to manage the user data in this page

function searchUserNames() {
    var container = document.getElementById('found_user_container');
    var name = document.getElementById('name').value;
    container.innerHTML = "Searching for users with the name of '" + name + "'.";

    firebase.firestore().collection('users').where("name_lc", "==", firebaseData.lcRef(name)).get()
        .then(function(querySnapshot) {
            // this worked
            if (querySnapshot.empty) {
                container.innerHTML = "Sorry: failed to find any users with the name of '" + name + "'.";
            }
            else {
                container.innerHTML = "";
            }
            querySnapshot.forEach(function (doc) {
                // for each user, add the user to the container
                displayUserData(container, doc);
            });
            return 1;
        })
        .catch(function(error) {
            // this didn't work
            container.innerHTML = "Sorry: failed to find any users with the name of '" + name + "': " + error;
            return 0;
        });
}

function searchUserEmails() {
    var container = document.getElementById('found_user_container');
    var email = document.getElementById('email').value;
    container.innerHTML = "Searching for users with the email address of '" + email + "'.";

    firebase.firestore().collection('users').where("email_lc", "==", firebaseData.lcRef(email)).get()
        .then(function(querySnapshot) {
            // this worked
            if (querySnapshot.empty) {
                container.innerHTML = "Sorry: failed to find any users with the email address of '" + email + "'.";
            }
            else {
                container.innerHTML = "";
            }
            querySnapshot.forEach(function (doc) {
                // for each user, add the user to the container
                displayUserData(container, doc);
            });
            return 1;
        })
        .catch(function(error) {
            // this didn't work
            container.innerHTML = "Sorry: failed to find any users with the email address of '" + email + "': " + error;
            return 0;
        });
}

function getAllOpenRequests() {
    var container = document.getElementById('found_user_container');
    container.innerHTML = "Searching for all active requests.";

    firebase.firestore().collection('users').where("isRequestPending", "==", true).get()
        .then(function(querySnapshot) {
            // this worked
            if (querySnapshot.empty) {
                container.innerHTML = "Sorry: failed to find any 'isRequestPending==true' users";
            }
            else {
                container.innerHTML = "";
            }
            querySnapshot.forEach(function (doc) {
                // for each user, add the user to the container
                displayUserData(container, doc);
            });
            return 1;
        })
        .catch(function(error) {
            // this didn't work
            container.innerHTML = "Sorry: failed to find any users with the 'isRequestPending' to be true: " + error;
            return 0;
        });
}

function getAllAdministrator() {
    var container = document.getElementById('found_user_container');
    container.innerHTML = "Searching for all administrators.";

    firebase.firestore().collection('users').where("isAdmin", "==", true).get()
        .then(function(querySnapshot) {
            // this worked
            if (querySnapshot.empty) {
                container.innerHTML = "Sorry: failed to find any 'isAdmin==true' users";
            }
            else {
                container.innerHTML = "";
            }
            querySnapshot.forEach(function (doc) {
                // for each user, add the user to the container
                displayUserData(container, doc);
            });
            return 1;
        })
        .catch(function(error) {
            // this didn't work
            container.innerHTML = "Sorry: failed to find any users with the 'isAdmin' to be true: " + error;
            return 0;
        });
}

function getAllReaders() {
    var container = document.getElementById('found_user_container');
    container.innerHTML = "Searching for all readers.";

    firebase.firestore().collection('users').where("isReader", "==", true).get()
        .then(function(querySnapshot) {
            // this worked
            if (querySnapshot.empty) {
                container.innerHTML = "Sorry: failed to find any 'isReader==true' users";
            }
            else {
                container.innerHTML = "";
            }
            querySnapshot.forEach(function (doc) {
                // for each user, add the user to the container
                displayUserData(container, doc);
            });
            return 1;
        })
        .catch(function(error) {
            // this didn't work
            container.innerHTML = "Sorry: failed to find any users with the 'isReader' to be true: " + error;
            return 0;
        });
}

function getAllTrackedUsers() {
    var container = document.getElementById('found_user_container');
    container.innerHTML = "Searching for all tracked users.";

    firebase.firestore().collection('users').where("isTracked", "==", true).get()
        .then(function(querySnapshot) {
            // this worked
            if (querySnapshot.empty) {
                container.innerHTML = "Sorry: failed to find any 'isTracked==true' users";
            }
            else {
                container.innerHTML = "";
            }
            querySnapshot.forEach(function (doc) {
                // for each user, add the user to the container
                displayUserData(container, doc);
            });
            return 1;
        })
        .catch(function(error) {
            // this didn't work
            container.innerHTML = "Sorry: failed to find any users with the 'isTracked' to be true: " + error;
            return 0;
        });
}

function onChangeUserAdminState(sourceId) {
    var user = firebaseData.getUser();
    var isAdminCheck = document.getElementById(sourceId + '_user_isAdmin');
    if (isAdminCheck.checked && user && user.uid == sourceId) {
        if (!confirm("You are about to turn off admin rights for yourself, this will make any further changes impossible, are you sure?")) {
            return 0;
        }
    }
    // the source Id is the UID of the user (the first half anyway), change this data
    var docRef = '/users/' + sourceId;
    firebase.firestore().doc(docRef)
        .update({
            isAdmin: (!isAdminCheck.checked)
        })
        .then(function() {
            // this worked
            isAdminCheck.checked = !isAdminCheck.checked;
            updateEmailLinkContents(sourceId);
        })
        .catch(function(error) {
            updateEmailLinkContents(sourceId);
            console.log("Failed to change the admin flag of the user", error);
            var messageSpan = document.getElementById(sourceId + '_user_message');
            if (messageSpan) {
                messageSpan.innerHTML = "Failed to change: " + error;
            }
        });
}

function onChangeUserReaderState(sourceId) {
    var user = firebaseData.getUser();
    var isReaderCheck = document.getElementById(sourceId + '_user_isReader');
    // the source Id is the UID of the user (the first half anyway), change this data
    var docRef = '/users/' + sourceId;
    firebase.firestore().doc(docRef)
        .update({
            isReader: (!isReaderCheck.checked)
        })
        .then(function() {
            // this worked
            isReaderCheck.checked = !isReaderCheck.checked;
            updateEmailLinkContents(sourceId);
        })
        .catch(function(error) {
            updateEmailLinkContents(sourceId);
            console.log("Failed to change the reading flag of the user", error);
            var messageSpan = document.getElementById(sourceId + '_user_message');
            if (messageSpan) {
                messageSpan.innerHTML = "Failed to change: " + error;
            }
        });
}

function onChangeUserTrackedState(sourceId) {
    var user = firebaseData.getUser();
    var isTrackedCheck = document.getElementById(sourceId + '_user_isTracked');
    // the source Id is the UID of the user (the first half anyway), change this data
    var docRef = '/users/' + sourceId;
    firebase.firestore().doc(docRef)
        .update({
            isTracked: (!isTrackedCheck.checked)
        })
        .then(function() {
            // this worked
            isTrackedCheck.checked = !isTrackedCheck.checked;
            updateEmailLinkContents(sourceId);
        })
        .catch(function(error) {
            updateEmailLinkContents(sourceId);
            console.log("Failed to change the tracking flag of the user", error);
            var messageSpan = document.getElementById(sourceId + '_user_message');
            if (messageSpan) {
                messageSpan.innerHTML = "Failed to change: " + error;
            }
        });
}

function onRequestAuthorise(sourceId) {
    // the source Id is the UID of the user (the first half anyway), change this data
    var docRef = '/users/' + sourceId;
    // make them a tracked reader and kill the authorisation request
    firebase.firestore().doc(docRef)
        .update({
            isReader: true,
            isTracked: true,
            isRequestPending: false,
        })
        .then(function() {
            // this worked
            document.getElementById(sourceId + '_user_open_request').style.display = 'none';
            document.getElementById(sourceId + '_user_isReader').checked = true;
            document.getElementById(sourceId + '_user_isTracked').checked = true;
            updateEmailLinkContents(sourceId);
            document.getElementById(sourceId + '_user_send_email').click();
        })
        .catch(function(error) {
            updateEmailLinkContents(sourceId);
            console.log("Failed to change the state flags of the user", error);
            var messageSpan = document.getElementById(sourceId + '_user_message');
            if (messageSpan) {
                messageSpan.innerHTML = "Failed to change: " + error;
            }
        });
}

function updateEmailLinkContents(sourceId) {
    // get all the types of access this user enjoys
    var nameEdit = document.getElementById(sourceId + '_user_name');
    var userTitle = document.getElementById(sourceId + '_user_title');
    var emailEdit = document.getElementById(sourceId + '_user_email');
    var emailLink = document.getElementById(sourceId + '_user_send_email');
    var isAdminCheck = document.getElementById(sourceId + '_user_isAdmin');
    var isTrackedCheck = document.getElementById(sourceId + '_user_isTracked');
    var isReaderCheck = document.getElementById(sourceId + '_user_isReader');

    userTitle.innerHTML = isAdminCheck.checked ? "an administrator" : (isTrackedCheck.checked && isReaderCheck.checked ? "a distributor" : (isReaderCheck.checked ? "a representative" : "unauthorised"));
    // construct the mail to link
    var hrefContent = "mailto:" + emailEdit.value
                    + "?subject="
                    + "Your Disrupt Sports Product Database permissions have changed"
                    + "&body="
                    + "Dear " + nameEdit.value + ","
                    + "%0D%0AAs requested, your access rights to the Disrupt Sports Database have changed"
                    + "%0D%0AYou are now "
                    + userTitle.innerHTML
                    + "%0D%0AIf you believe this to be an error please contact Disrupt Sports as soon as possible to have your access adjusted."
                    ;
    // and set this content properly
    emailLink.href = hrefContent;
}

function splitId(elementToSplit) {
    var idString = elementToSplit.id;
    var index = idString.lastIndexOf('_');
    return [idString.substring(0, index), idString.substring(index + 1, idString.length)];
}

var nextSearch = null;
function getAllUsers() {
    var container = document.getElementById('found_user_container');
    container.innerHTML = "Searching for all users (in batches of 25).";
    // get all the users and add them to the list
    if (!nextSearch) {
        nextSearch = firebase.firestore().collection('users').orderBy("name_lc").limit(25);
    }
    // perform the search now
    nextSearch.get()
        .then(function (querySnapshot) {
            // Get the last visible document
            if (!querySnapshot.empty) {
                var lastVisible = querySnapshot.docs[querySnapshot.docs.length-1];
                if (lastVisible) {
                    // Construct a new query starting at this document to get the next 25 users.
                    nextSearch = firebase.firestore().collection("users")
                            .orderBy("name_lc")
                            .startAfter(lastVisible)
                            .limit(25);
                    document.getElementById('search_all_button').innerHTML = "next 25";
                }
                else {
                    nextSearch = null;
                    document.getElementById('search_all_button').innerHTML = "List all users";
                }
            }
            else {
                nextSearch = null;
                document.getElementById('search_all_button').innerHTML = "List all users";
            }
            // and show all this data
            querySnapshot.forEach(function (doc) {
                // for each user, add the user to the container
                displayUserData(container, doc);
            });
        })
        .catch(function(error) {
            // this didn't work
            container.innerHTML = "Sorry: failed to find any more users: " + error;
        });
}

function displayUserData(container, doc) {
    var userDiv = document.getElementById('user_template').cloneNode(true);
    container.appendChild(userDiv);
    // set the id of this
    userDiv.id = doc.id;
    // and get the children we want to use
    var nameEdit = userDiv.querySelector('#user_name');
    var userTitle = userDiv.querySelector('#user_title');
    var uidEdit = userDiv.querySelector('#user_uid');
    var emailEdit = userDiv.querySelector('#user_email');
    var emailLink = userDiv.querySelector('#user_send_email');
    var isAdminCheck = userDiv.querySelector('#user_isAdmin');
    var isReaderCheck = userDiv.querySelector('#user_isReader');
    var isTrackedCheck = userDiv.querySelector('#user_isTracked');
    var messageSpan = userDiv.querySelector('#user_message');

    var openRequestDiv = userDiv.querySelector('#user_open_request');
    var openRequestCheck = userDiv.querySelector('#user_isDistributor');
    var userCompany = userDiv.querySelector('#user_company');
    var userPhone = userDiv.querySelector('#user_phone');
    var userTbm = userDiv.querySelector('#user_tbm');
    var userTbn = userDiv.querySelector('#user_tbn');
    
    // to avoid duplicates, we want our own IDs here
    nameEdit.id = doc.id + '_' + nameEdit.id;
    userTitle.id = doc.id + '_' + userTitle.id;
    uidEdit.id = doc.id + '_' + uidEdit.id;
    emailEdit.id = doc.id + '_' + emailEdit.id;
    emailLink.id = doc.id + '_' + emailLink.id;
    isAdminCheck.id = doc.id + '_' + isAdminCheck.id;
    isReaderCheck.id = doc.id + '_' + isReaderCheck.id;
    isTrackedCheck.id = doc.id + '_' + isTrackedCheck.id;
    openRequestDiv.id = doc.id + '_' + openRequestDiv.id;
    openRequestCheck.id = doc.id + '_' + openRequestCheck.id;
    userCompany.id = doc.id + '_' + userCompany.id;
    userPhone.id = doc.id + '_' + userPhone.id;
    userTbm.id = doc.id + '_' + userTbm.id;
    userTbn.id = doc.id + '_' + userTbn.id;
    messageSpan.id = doc.id + '_' + messageSpan.id;
    
    userDiv.querySelector('#user_isDistributor_label').setAttribute("onclick", "onRequestAuthorise('" + doc.id + "')");
    userDiv.querySelector('#user_isAdmin_label').setAttribute("onclick", "onChangeUserAdminState('" + doc.id + "')");
    userDiv.querySelector('#user_isReader_label').setAttribute("onclick", "onChangeUserReaderState('" + doc.id + "')");
    userDiv.querySelector('#user_isTracked_label').setAttribute("onclick", "onChangeUserTrackedState('" + doc.id + "')");

    // get the data and populate the fields
    var data = doc.data();
    uidEdit.value = doc.id;
    nameEdit.value = data.name;
    emailEdit.value = data.email;
    isAdminCheck.checked = data.isAdmin == true;
    isReaderCheck.checked = data.isReader == true;
    isTrackedCheck.checked = data.isTracked == true;
    openRequestCheck.checked = false;   // always false as want to authorise
    if (data.isRequestPending) {
        // there is a request pending, show the option to grant it
        openRequestDiv.style.display = null;
    }
    // set all the extended data
    userCompany.value = data.company;
    userPhone.value = data.phone;
    userTbm.value = data.trade;
    userTbn.value = data.trade_no;
    messageSpan.innerHTML = "";
    // and setup the email link
    updateEmailLinkContents(doc.id);
}

document.addEventListener('firebaseuserchange', function() {
    console.log('login changed so ready for input');
});