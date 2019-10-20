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

function loadCategoryData(categoryRef, resultContainer) {
    firebaseData.getCategoryById(categoryRef.id, 
        function(doc) {
            // got it
            resultContainer.innerHTML += JSON.stringify( doc.data(), null, 2 );
        },
        function(error) {
            // failed
            console.log('category not found: ', error);
        });
}

function onSubmitSearch() {
    // search the selected categories for matches, find all the categories to show from those matched
    var resultContainer = document.getElementById('search_results_container');
    var searchTerm = document.getElementById('search').value;
    resultContainer.innerHTML = "";
    if (document.getElementById('search_categories').checked) {
        // search for categories
        firebaseData.searchCollectionForWord(firebaseData.collectionCategories, searchTerm,
            function(querySnapshot) {
                // success, add all to the HTML
                querySnapshot.forEach(function (doc) {
                    // show each of these found documents in the HTML
                    resultContainer.innerHTML += JSON.stringify( doc.data(), null, 2 );
                });
            },
            function (error) {
                // failed
                console.log('searching failed: ', error);
            });
    }
    if (document.getElementById('search_items').checked) {
        // search for categories
        firebaseData.searchCollectionForWord(firebaseData.collectionItems, searchTerm,
            function(querySnapshot) {
                // success, add all to the HTML
                querySnapshot.forEach(function (doc) {
                    // show each of the categories of the item in the HTML
                    loadCategoryData(doc.data().category_ref, resultContainer);
                });
            },
            function (error) {
                // failed
                console.log('searching failed: ', error);
            });
    }
    if (document.getElementById('search_quantities').checked) {
        // search for categories
        firebaseData.searchCollectionForWord(firebaseData.collectionItems, searchTerm,
            function(querySnapshot) {
                // success, add all to the HTML
                querySnapshot.forEach(function (doc) {
                    // show each of the categories of the item in the HTML
                    loadCategoryData(doc.data().category_ref, resultContainer);
                });
            },
            function (error) {
                // failed
                console.log('searching failed: ', error);
            });
    }
}


document.addEventListener('firebaseuserchange', function() {
    console.log('login changed so ready for input');
    checkUserState();			
});