// https://firebase.google.com/docs/auth/web/manage-users#get_the_currently_signed-in_user
// need to manage the user data in this page

function sendEmailVerfication() {
    var user = firebaseData.getUser();
    if (user) {
        user.sendEmailVerification().then(function() {
            // Email sent.
            alert('email sent to ' + user.email);
        }).catch(function(error) {
            // An error happened.
            console.log(error);
        });
    }
    populateUserData();
}

function logout() {
    firebase.auth().signOut().then(function() {
        // Sign-out successful.
    }).catch(function(error) {
        // An error happened.
        console.log(error);
    });
    window.location = 'index.html';
}

function ensureUpToDateUserData(user, data) {
    // to be sure we have an up-to-date picture of our user, let's update their name and email here if wrong...
    if (data['name'] !== user.displayName || data['email' !== user.email]) {
        // update our data held about them here
        const docRef = firebase.firestore().collection('users').doc(user.uid)
        docRef.update({
            name: user.displayName,
            name_lc: user.displayName.toLowerCase(),
            email: user.email,
            email_lc: user.email.toLowerCase()
        }).catch(function(error) {
            console.log("Error updating user information held against them", error);
        });
    }
}

function populateUserData() {
    var user = firebaseData.getUser();
    if (user) {
        // populate the form, defaulting everything we don't know yet
        document.getElementById('profile_data').style.display = null;
        document.getElementById('name').value = user.displayName;
        document.getElementById('email').value = user.email;
        document.getElementById('email-verified').checked = user.emailVerified;
        document.getElementById('user_image').src = user.photoURL;

        // hide the email verification button if verified already
        if (user.emailVerified) {
            document.getElementById('send_verification').style.display = 'none';
        }
        else {
            document.getElementById('send_verification').style.display = null;
        }
        // get the user data from firebase here
        firebaseData.getUserData(user, 
            function(data) {
                //TODO we have the user data here, set the data correctly

                // be sure to update our map of their name and email etc that we keep a copy of
                ensureUpToDateUserData(user, data);
            }, function(error) {
                // this is the failure to get the data, do our best I suppose
                console.log("Failed to get the firestore user data for " + user + ":", error);
            });
    }
    else {
        // hide the form
        document.getElementById('profile_data').style.display = 'none';
    }
};

function deleteProfileCountdown() {
    var countdownDiv = document.getElementById('delete_button_countdown');
    var deleteButton = document.getElementById('delete_Profile_button');
    var seconds = 4;
    countdownDiv.innerHTML = 'Pausing just a little for you to reconsider...'
    // Count down from 5 to show the button
    let timerId = setInterval(() => countdownDiv.innerHTML = seconds--, 1000);

    // after 5 seconds stop
    setTimeout(() => { clearInterval(timerId); countdownDiv.style.display = 'none'; deleteButton.style.display = null; }, 5000);
}

function deleteProfile() {
    // okay, let's delete the Profile data here
    var user = firebaseData.getUser();
    if (!user) {
        // they don't seem to be logged in
        alert("Sorry about this, but you don't seem to be logged in properly, try refreshing the page and starting again." );
    }
    else if (confirm("Last chance, are you sure you want to delete everything?")) {
        // delete all the location shares they have published
        firebaseData.deleteAllUserData(user,
            function() {
                // cool, deleted all the user data
                logout();
            },
            function(error) {
                // oops
                alert("Sorry about this, but there was some error in removing all your data, please contact us to confirm all you data was in-fact removed. Please reference this weird set of letters to help us find it: '" + user.uid + "'." );
                console.error("Error deleting location shared: ", error);
            });
    }
}

function enablePasswordChange() {
    // hide the change button
    document.getElementById('change_password_button').style.display = 'none';
    // show the password controls
    document.getElementById('change_password_container').style.display = null;
}

function resetPassword() {
    // check the password values
    var passwordOneControl = document.getElementById('password_one');
    var passwordTwoControl = document.getElementById('password_two');
    var user = firebaseData.getUser();
    if (user && passwordOneControl.value === passwordTwoControl.value) {
        // this is the new password
        user.updatePassword(passwordOneControl.value).then(function () {
            // Update successful.
            document.getElementById('change_password_button').style.display = null;
            document.getElementById('change_password_container').style.display = 'none';
        }).catch(function (error) {
            // An error happened.
            alert(error);
        });
    }
    else {
        alert('passwords have to match...');
    }
}

function enableEdit() {
    var nameEdit = document.getElementById('name');
    var emailEdit = document.getElementById('email');

    // stop the entry fields from being readonly
    nameEdit.removeAttribute('readonly');
    emailEdit.removeAttribute('readonly');

    listenForChange(nameEdit, function() {isChangedLocation = true; setUserDataEdited(true);});
    listenForChange(emailEdit, function() {isChangedLocation = true; setUserDataEdited(true);});

    // hide the change button
    document.getElementById('edit_profile_button').style.display = 'none';
    // and show the editing buttons
    document.getElementById('edit_profile_commit_button').style.display = null;
    document.getElementById('edit_profile_discard_button').style.display = null;
}

function disableEdit() {
    // hide the editing buttons
    document.getElementById('edit_profile_commit_button').style.display = 'none';
    document.getElementById('edit_profile_discard_button').style.display = 'none';
    // and show the edit button
    document.getElementById('edit_profile_button').style.display = null;
    document.getElementById('edit_profile_commit_button').classList.remove('special');

    // put the readonly back in
    var nameEdit = document.getElementById('name');
    var emailEdit = document.getElementById('email');

    // stop the entry fields from being readonly
    nameEdit.setAttribute('readonly', true);
    emailEdit.setAttribute('readonly', true);
}

function setUserDataEdited(isChanged) {
    if (isChanged) {
        document.getElementById('edit_profile_commit_button').classList.add('special');
    }
    else {
        document.getElementById('edit_profile_commit_button').classList.remove('special');
    }
}

function saveEdits() {
    // save the changes in the values to the profile
    var user = firebaseData.getUser();
    var newName = document.getElementById('name').value;
    var newEmail = document.getElementById('email').value;

    // disabled more editing
    disableEdit();

    // update the data in the profile
    if (user != null) {
        // update all the data in the profile here to that in the controls
        if (user.displayName !== newName) {
            user.updateProfile({
                displayName: newName
            }).then(function () {
                // Update successful
                populateUserData();
                location.reload();
            }).catch(function (error) {
                // An error happened.
                console.log('failed to change the profile data for some reason', error);
                populateUserData();
            });
        }
        if (newEmail !== user.email) {
            // need to update the email too
            user.updateEmail(newEmail).then(function () {
                // Update successful.
                populateUserData();
                location.reload();
            }).catch(function (error) {
                // An error happened.
                console.log('failed to change the email for some reason', error);
                alert(error);
                populateUserData();
            });
        }
        document.getElementById('edit_profile_commit_button').classList.remove('special');
    }
}

function discardEdits() {
    // throw out the changes in the values to the profile
    document.getElementById('edit_profile_commit_button').style.display = 'none';
    document.getElementById('edit_profile_discard_button').style.display = 'none';
    // disabled more editing
    disableEdit();
    document.getElementById('edit_profile_commit_button').classList.remove('special');
    // put the old data back
    populateUserData();
}

function setShareLocationFlag(isChanged) {
    if (isChanged) {
        document.getElementById('edit_share_location_commit_button').classList.add('special');
    }
    else {
        document.getElementById('edit_share_location_commit_button').classList.remove('special');
    }
}

function listenForChange(elementToListen, functionToCall) {
    if (elementToListen.addEventListener) {
        elementToListen.addEventListener('input', function() {
            // event handling code for sane browsers
            functionToCall();
        }, false);
    } else if (elementToListen.attachEvent) {
        elementToListen.attachEvent('onpropertychange', function() {
            // IE-specific event handling code
            functionToCall();
        });
    }
}

document.addEventListener('firebaseuserchange', function() {
    console.log('login changed so ready for input');
    populateUserData();			
});