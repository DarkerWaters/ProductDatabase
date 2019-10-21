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

var categoriesFound;

function onCategoryFound(categoryContainer, resultContainer, categoryId, categoryData) {
    if (categoriesFound.includes(categoryId)) {
        // already added
    }
    else {
        // remember we added this already
        categoriesFound.push(categoryId);
        // create a link for this found container
        var linkDiv = document.getElementById('template_category_link').cloneNode(true);
        // set the unique ID for this
        linkDiv.id = "link_category_" + categoryId;
        var links = linkDiv.getElementsByTagName('a');
        for (var i = 0; i < links.length; ++i) {
            links[i].id = "link_" + i + "_" + categoryId;
            links[i].href = "#" + categoryId;
            links[i].innerHTML = categoryData.name;
        }
        // and add to the container
        categoryContainer.appendChild(linkDiv);

        var resultDiv = document.getElementById('template_category_result').cloneNode(true);
        resultDiv.id = categoryId;
        // do the data for this
        setContainerData(resultDiv, 'category', 'name', categoryId, categoryData);
        setContainerData(resultDiv, 'category', 'description', categoryId, categoryData);
        setContainerData(resultDiv, 'category', 'notes', categoryId, categoryData);
        // also create the template for the category we found
        resultContainer.appendChild(resultDiv);
    }
}

function setContainerData(parent, level, variable, id, data) {
    var divElement = parent.querySelector('#' + level + "_" + variable);
    divElement.id = 'level_variable_' + id;
    divElement.innerHTML = data[variable];
}

function onSubmitSearch() {
    // search the selected categories for matches, find all the categories to show from those matched
    var categoryContainer = document.getElementById('found_categories');
    var resultContainer = document.getElementById('search_results_container');
    var searchTerm = document.getElementById('search').value;
    // clear all the old data
    resultContainer.innerHTML = "";
    categoryContainer.innerHTML = "";
    categoriesFound = [];

    if (document.getElementById('search_categories').checked) {
        // search for categories
        firebaseData.searchCollectionForWord(firebaseData.collectionCategories, searchTerm,
            function(querySnapshot) {
                // success, add all to the HTML
                querySnapshot.forEach(function (doc) {
                    // show each of these found documents in the HTML
                    onCategoryFound(categoryContainer, resultContainer, doc.id, doc.data())
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
                    loadCategoryData(doc.data().category_ref);
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
                    loadCategoryData(doc.data().category_ref);
                });
            },
            function (error) {
                // failed
                console.log('searching failed: ', error);
            });
    }
}

function loadCategoryData(categoryRef) {
    var categoryContainer = document.getElementById('found_categories');
    var resultContainer = document.getElementById('search_results_container');
    firebaseData.getCategoryById(categoryRef.id, 
        function(doc) {
            // got it
            onCategoryFound(categoryContainer, resultContainer, doc.id, doc.data())
        },
        function(error) {
            // failed
            console.log('category not found: ', error);
        });
}

document.addEventListener('firebaseuserchange', function() {
    console.log('login changed so ready for input');

    const node = document.getElementById("search");
    node.addEventListener("keyup", function(event) {
        if (event.key === "Enter") {
            onSubmitSearch();
        }
    });
    checkUserState();			
});