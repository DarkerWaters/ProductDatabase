// https://firebase.google.com/docs/auth/web/manage-users#get_the_currently_signed-in_user
// need to manage the user data in this page

function checkUserState() {
    var user = firebaseData.getUser();
    if (user) {
        // logged in - hide this
        document.getElementById('not_logged_in').style.display = 'none';
        document.getElementById('not_reader').style.display = null;
        firebaseData.getUserData(user,
            function(firebaseUserData) {
                // got the data
                if (firebaseData.isUserReader(firebaseUserData)) {
                    // we are a reader
                    document.getElementById('not_reader').style.display = 'none';
                }
                else {
                    // not a reader
                    document.getElementById('not_reader').style.display = null;
                }
            }),
            function(error) {
                // failed
                console.log('failed to get the user data to see if a reader', error);
                document.getElementById('not_reader').style.display = null;
            }
    }
    else {
        // not logged in, show this
        document.getElementById('not_logged_in').style.display = null;
        document.getElementById('not_logged_in').style.display = null;
    }
}


document.addEventListener('firebaseuserchange', function() {
    console.log('login changed so ready for input');
    checkUserState();			
});