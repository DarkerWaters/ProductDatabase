function signinFirebase() {
    // Initialize the FirebaseUI Widget using Firebase.
    // https://firebase.google.com/docs/auth/web/firebaseui
    var uiConfig = {
        callbacks: {
            signInSuccessWithAuthResult: function (authResult, redirectUrl) {
                // signed in successfully, hide the box we used to select the type
                document.getElementById('firebase_login_container').style.display = "none";
                // and we can get the data here
                /*
                var user = authResult.user;
                var credential = authResult.credential;
                var isNewUser = authResult.additionalUserInfo.isNewUser;
                var providerId = authResult.additionalUserInfo.providerId;
                var operationType = authResult.operationType;
                // Do something with the returned AuthResult.
                */
                // Return type determines whether we continue the redirect automatically
                // or whether we leave that to developer to handle.
                return true;
            },
            signInFailure: function (error) {
                // Some unrecoverable error occurred during sign-in.
                document.getElementById('firebase_login_container').style.display = "none";
                // Return a promise when error handling is completed and FirebaseUI
                // will reset, clearing any UI. This commonly occurs for error code
                // 'firebaseui/anonymous-upgrade-merge-conflict' when merge conflict
                // occurs. Check below for more details on this.
                return handleUIError(error);
            },
            uiShown: function () {
                // The widget is rendered, hide the loader button
                var signIn = document.getElementById('firebaseSignIn');
                if (signIn) {
                    signIn.style.display = 'none';
                }
            }
        },
        credentialHelper: firebaseui.auth.CredentialHelper.ACCOUNT_CHOOSER_COM,
        // Query parameter name for mode.
        queryParameterForWidgetMode: 'mode',
        // Query parameter name for sign in success url.
        queryParameterForSignInSuccessUrl: 'signInSuccessUrl',
        // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
        signInFlow: 'popup',
        signInSuccessUrl: '#',
        signInOptions: [
            // Leave the lines as is for the providers you want to offer your users.
            firebase.auth.GoogleAuthProvider.PROVIDER_ID
            /*,firebase.auth.TwitterAuthProvider.PROVIDER_ID
            {
                provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
                // Whether the display name should be displayed in the Sign Up page.
                requireDisplayName: true
            }*/
            /*,{
                provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
                // Invisible reCAPTCHA with image challenge and bottom left badge.
                recaptchaParameters: {
                    type: 'image',
                    size: 'invisible',
                    badge: 'bottomleft'
                }
            }*/
            //,firebase.auth.FacebookAuthProvider.PROVIDER_ID
            //,firebase.auth.GithubAuthProvider.PROVIDER_ID
            ,firebase.auth.EmailAuthProvider.PROVIDER_ID
        ],
        // tosUrl and privacyPolicyUrl accept either url string or a callback
        // function.
        tosUrl: 'https://www.disruptsports.com/terms-and-conditions/',
        privacyPolicyUrl: 'https://www.disruptsports.com/privacy-policy/'
    };

    // show the container to login with
    document.getElementById('firebase_login_container').style.display = null;

    // Initialize the FirebaseUI Widget using Firebase.
    if(firebaseui.auth.AuthUI.getInstance()) {
        const ui = firebaseui.auth.AuthUI.getInstance();
        ui.start('#firebase_login_container', uiConfig);
    } else {
        const ui = new firebaseui.auth.AuthUI(firebase.auth());
        ui.start('#firebase_login_container', uiConfig);	
    }
}

function updateFirebaseUserDisplay(user) {
    // update the dispay according the user being logged on or not
    updateMenuButtons(user, false, false);
    // update user role details
    updateFirebaseUserItems(user);
}

function initialiseFirebaseLoginButton() {
    // setup the login button properly
    var signIn = document.getElementById('firebaseSignIn');
    var signedIn = document.getElementById('firebaseSignedIn');
    if (signIn && signedIn) {
        signIn.style.display = 'none';
        signedIn.style.display = 'none';
    }
    firebase.auth().onAuthStateChanged(function(user) {
        // update the display of the user here
        updateFirebaseUserDisplay(user);
        // dispatch this change to the document
        document.dispatchEvent(new Event('firebaseuserchange'));
    });
};

function showFirebaseLoginButtons(user, userData) {
    // get if the user is an  admin
    var isAdmin = firebaseData.isUserAdmin(userData);
    // and update the buttons accordingly
    updateMenuButtons(user, isAdmin);
}

function removeFirebaseLoginButtons() {
    // remove all the coaching options
    updateMenuButtons(null, false, false);
}

function updateMenuButtons(user, isAdmin) {
    // update the sign in buttons on the menu
    var signIn = document.getElementById('firebaseSignIn');
    var signedIn = document.getElementById('firebaseSignedIn');
    if (signIn && signedIn) {
        if (user) {
            // User is signed in.
            signIn.style.display = 'none';
            signedIn.style.display = null;
            signedIn.innerHTML  = '<a href="profile.html">' + sanitizeHTML(user.displayName) + '</a>';
        } else {
            // No user is signed in.
            signIn.style.display = null;
            signedIn.style.display = 'none';
        }
    }
    // and admin if we are admin
    var adminItems = document.getElementsByClassName("menu_admin");
    for (var i = 0; i < adminItems.length; i++) {
        if (isAdmin) {
            adminItems[i].style.display = null;
        }
        else {
            adminItems[i].style.display = 'none';
        }
    }
    // the drop-down menu is different though - we lost all our ids so we have to find them by hand
    var dropDownMenus = document.getElementsByClassName('nav_menu_buttons');
    if (dropDownMenus && dropDownMenus.length === 1) {
        var dropDownItems = dropDownMenus[0].getElementsByClassName("link");
        var isHidingBelow = false;
        for (var i = 0; i < dropDownItems.length; ++i) {
            if (dropDownItems[i].classList.contains('depth-0')) {
                // by default, we are not hiding this
                isHidingBelow = false;
                dropDownItems[i].style.display = null;
                // this is a top-level, is it the admin one
                if (dropDownItems[i].innerHTML.includes('Admin')) {
                    // this is admin
                    if (!isAdmin) {
                        dropDownItems[i].style.display = 'none';
                        isHidingBelow = true;
                    }
                }
                else if (dropDownItems[i].innerHTML.includes('Extras')) {
                    // this is extras
                    if (!isCoach) {
                        dropDownItems[i].style.display = 'none';
                        isHidingBelow = true;
                    }
                }
                else if (dropDownItems[i].innerHTML.includes('Log In...')) {
                    // this is the log in button
                    if (user) {
                        dropDownItems[i].innerHTML = dropDownItems[i].innerHTML.replace('Log In...', sanitizeHTML(user.displayName));
                        dropDownItems[i].href = 'profile.html';
                        isHidingBelow = true;
                    }
                }
            }
            else if (isHidingBelow) {
                // hide this, it's below a top-level one we want to hide
                dropDownItems[i].style.display = 'none';
            }
            else {
                // show it then
                dropDownItems[i].style.display = null;
            }
        }
    }
}
    
function updateFirebaseUserItems (user) {
    // show the extra buttons when logging in changes
    if (user) {	
        firebaseData.getUserData(user, function(userData) {
            // we have the data, display the coaching things if we are a coach
            showFirebaseLoginButtons(user, userData);
        },
        function(error) {
            console.log("Failed to get the user data;", error);
            // failed to get the data
            removeFirebaseLoginButtons();
        })
    }
    else {
        // not logged in
        removeFirebaseLoginButtons();
    }
}

/*!
 * Sanitize and encode all HTML in a user-submitted string
 * (c) 2018 Chris Ferdinandi, MIT License, https://gomakethings.com
 * @param  {String} str  The user-submitted string
 * @return {String} str  The sanitized string
 */
var sanitizeHTML = function (str) {
	var temp = document.createElement('div');
	temp.textContent = str;
	return temp.innerHTML;
};


const firebaseData = {
    // spec all the collections here for easier getting of data
    collectionCategories : 'item_categories',
    collectionItems : 'items',
    collectionQuantities : 'quantities',
    collectionUsers : 'users',
    collectionActivity: 'activity',
    currentUserData : null,
    logsCleaned : [],

    lcRef : function (str) {
        if (!str) {
            return str;
        }
        else {
            // remove all spaces and make it lowercase
            str = str.toLowerCase().replace(/\s/g,'');
            // and get rid of anything too weird
            str = str.replace(/\W/g, '');
            if (str.length > 1 && str.slice(-1) === 's') {
                // remove any trailing 's' characters
                str = str.slice(0, -1);
            }
            return str;
        }
    },
    
    lcOldRef : function (str) {
        if (!str) {
            return str;
        }
        else {
            // remove all spaces and make it lowercase
            str = str.toLowerCase().replace(/\s/g,'');
            if (str.length > 1 && str.slice(-1) === 's') {
                // remove any trailing 's' characters
                str = str.slice(0, -1);
            }
            return str;
        }
    },

    lcWords : function(str) {
        if (!str) {
            return [];
        }
        else {
            // make the words split from the string
            var words = [];
            var toProcess = str.toLowerCase().split(/\s/);
            for (var i = 0; i < toProcess.length; ++i) {
                // for each word from the string split, add it to the array
                var word = toProcess[i];
                words.push(firebaseData.lcRef(word));
                // and combine it with all following it
                for (var j = i + 1; j < toProcess.length; ++j) {
                    word += toProcess[j];
                    words.push(firebaseData.lcRef(word));
                }
            }
            // return all the words combined into a nice array of options to search for
            return words;
        }
    },

    defaultCategory : function(categoryName) {
        return firebaseData.autoCompleteData({
            name : categoryName ? categoryName : 'New Category',
            // don't create empty data - to prevent over-writing any existing data on the update
            //image : 'an image URL',
            //description : 'A newly created category',
            //notes : 'Any notes about the category',
            //search_terms : 'A list of words for search to find',
        });
    },

    defaultItem : function(categoryDocId, categoryData, itemName, qualityStr) {
        return firebaseData.autoCompleteData({
            name : itemName ? itemName : "New Item",
            category_name : categoryData.name,
            category_ref : firebase.firestore().doc(firebaseData.collectionCategories + '/' + categoryDocId),
            quality : qualityStr,
            // don't create empty data - to prevent over-writing any existing data on the update
            //image : 'an image URL',
            //url: 'an external URL',
            //description : 'A newly created item',
            //notes : 'Any notes about the item',
            //physical : 'The physical attributes of the item',
            //colours : 'The colour options',
            //supplier : 'The supplier used',
            //search_terms : 'A list of words for search to find',
        });
    },

    defaultQuantity : function (itemDocId, itemData, quantityNumber, gbpValue, gbpNotes, usdValue, usdNotes, audValue, audNotes, notesValue) {
        return firebaseData.autoCompleteData({
            category_name : itemData.category_name,
            category_ref : itemData.category_ref,
            item_ref : firebase.firestore().doc(firebaseData.collectionItems + '/' + itemDocId),
            item_name : itemData.name,
            item_quality : itemData.quality,
            quantity : Number(quantityNumber),
            gbp : Number(gbpValue),
            gbp_notes : gbpNotes ? gbpNotes : '',
            usd : Number(usdValue),
            usd_notes : usdNotes ? usdNotes : '',
            aud : Number(audValue),
            aud_notes : audNotes ? audNotes : '',
            notes : notesValue ? notesValue : '',
            //search_terms : 'A list of words for search to find',
        });
    },

    defaultLogItem : function(user, userData, activity, itemId, itemData) {
        return {
            action : activity ? activity : "",
            by : user.uid ? user.uid : "",
            by_name : userData.name ? userData.name : "",
            by_name_lc: userData.name ? firebaseData.lcRef(userData.name) : "",
            by_email : userData.email ? userData.email : "",
            by_email_lc: userData.email ? firebaseData.lcRef(userData.email) : "",
            by_company: userData.company ? userData.company : "",
            at : new Date(),
            item_name : itemData.name ? itemData.name : "",
            item_quality : itemData.quality ? itemData.quality : "",
            item_ref : firebase.firestore().doc(firebaseData.collectionItems + '/' + itemId),
            category_name : itemData.category_name ? itemData.category_name : "",
            category_ref : itemData.category_ref ? itemData.category_ref : "",
        };
    },

    autoCompleteData : function(docData) {
        // complete the data on this object, first remove spaces and lower case the name for searching
        var wordsArray = []
        if (docData.name) {
            docData.name_lc = firebaseData.lcRef(docData.name);
            // this can be the start of the words
            wordsArray = [docData.name_lc];
        }
        if (docData.quality) {
            docData.quality_lc = firebaseData.lcRef(docData.quality);
            // we can include this in our words too
            wordsArray.push(docData.quality_lc);
        }
        if (docData.supplier) {
            docData.supplier_lc = firebaseData.lcRef(docData.supplier);
            // we can include this in our words too
            wordsArray.push(docData.supplier_lc);
        }
        // now concatenate all the entries into an array of words to use
        if (docData.name) {
            wordsArray = wordsArray.concat(firebaseData.lcWords(docData.name));
        }
        if (docData.quality) {
            wordsArray = wordsArray.concat(firebaseData.lcWords(docData.quality));
        }
        if (docData.category_name) {
            wordsArray = wordsArray.concat(firebaseData.lcWords(docData.category_name));
        }
        if (docData.item_name) {
            wordsArray = wordsArray.concat(firebaseData.lcWords(docData.item_name));
        }
        if (docData.item_quality) {
            wordsArray = wordsArray.concat(firebaseData.lcWords(docData.item_quality));
        }
        if (docData.search_terms) {
            wordsArray = wordsArray.concat(firebaseData.lcWords(docData.search_terms));
        }
        // set this data
        docData.words = wordsArray;
        // add the last update performed
        var currentUser = this.getUser();
        docData.last_update = new Date();
        docData.last_updated_by = currentUser ? currentUser.uid : 'unknown';
        // return the data
        return docData;
    },

    getUser : function () {
        return firebase.auth().currentUser;
    },

    getUserData : function (user, onSuccess, onFailure) {
        // get the user data from firebase
        if (user && firebase) {
            // get the current UID and get the data in the store for this user
            var userUid = user.uid;
            var fData = this;
            // get the data for the user
            firebase.firestore().collection(firebaseData.collectionUsers).doc(userUid).get()
                .then(function(doc) {
                    if (doc && doc.exists) {
                        // have the user data, cool - use it
                        var isNewCachedData = !firebaseData.currentUserData;
                        firebaseData.currentUserData = doc.data();
                        if (isNewCachedData && firebaseData.currentUserData && firebaseData.currentUserData.isAdmin) {
                            // we have just retrieved the admin user's data - a good time to delete any
                            // global data we might have collected over what we actually need
                            firebaseData.clearAgeingGlobalTrackingData();
                        }
                    } else {
                        // log this
                        console.log("No document data exists for user", user);
                        // but let's fix it though
                        firebaseData.currentUserData = fData.createDefaultUserData(user);
                    }
                    // do stuff with the data
                    onSuccess(firebaseData.currentUserData);
                })
                .catch(function(error) {
                    onFailure ? onFailure(error) : console.log("Failed to get the document: ", error);
                });
        }
        else {
            // no firebase
            return null;
        }
    },

    createDefaultUserData : function (user) {
        var newUserData = {
            // setup the blank user data here
            name: user.displayName,
            name_lc: this.lcRef(user.displayName),
            email: user.email,
            email_lc: this.lcRef(user.email),
            isAdmin: false,
            isReader: false,
            isTracked: true,
            company: "",
            company_lc: "",
            phone: "",
            trade: "",
            trade_no: "",
            isRequestPending: false,
        };
        firebase.firestore().collection(firebaseData.collectionUsers).doc(user.uid).set(newUserData, {merge: true})
            .then(function() {
                // this worked
                console.log('added user data', user);
            })
            .catch(function(error) {
                // failed
                console.log("failed to create the user data", error);
            });
        return newUserData;
    },

    getUserProfiles : function (user) {
        user.providerData.forEach(function (profile) {
            console.log("Sign-in provider: " + profile.providerId);
            console.log("  Provider-specific UID: " + profile.uid);
            console.log("  Name: " + profile.displayName);
            console.log("  Email: " + profile.email);
            console.log("  Photo URL: " + profile.photoURL);
        });
    },

    logUserActivity : function (activity, itemId, itemData) {
        var user = this.getUser();
        if (user) {
            // have a user, if they are being tracked then we need to log this action to the database
            if (!firebaseData.currentUserData) {
                // there is no user data, get it before we track anything against the user
                this.getUserData(user, 
                    function(firebaseUserData) {
                        // this worked, track the data here
                        firebaseData.addTrackedData(user, firebaseUserData, activity, itemId, itemData);
                    },
                    function(error) {
                        // failed
                        console.log('failed log anything against the current user', error);
                    });
            } else {
                // just do it against the cached user data
                firebaseData.addTrackedData(user, firebaseData.currentUserData, activity, itemId, itemData);
            }
        }
    },

    getGlobalTrackingData : function(lastVisible, limit, onSuccess) {
        // go through all the expired global data and delete all the old stuff
        var search;
        // create the correct search
        if (lastVisible) {
            search = firebase.firestore().collection(firebaseData.collectionActivity)
                .orderBy("at", "desc")
                .startAfter(lastVisible)
                .limit(limit);
        } else {
            search = firebase.firestore().collection(firebaseData.collectionActivity)
                .orderBy("at", "desc")
                .limit(limit);
        }
        // find everything in range and return this as information
        search.get()
            .then(function(querySnapshot) {
                // have all the data, let the caller have
                onSuccess(querySnapshot);
            })
            .catch(function(error) {
                // this didn't work
                console.log("Failed to get the log collection to show activity: ", error);
            });
    },

    clearAgeingGlobalTrackingData : function() {
        // find everything that is this date or older to delete
        console.log("deleting old activity tracking data");
        var deleteDate = new Date();
        // Set it to one month ago
        deleteDate.setMonth(deleteDate.getMonth() - 1);
        var firebaseDeleteDate = firebase.firestore.Timestamp.fromDate(deleteDate);
        // get all the data older than this to delete it
        firebase.firestore()
            .collection(firebaseData.collectionActivity)
            .where("at", "<", firebaseDeleteDate)
            .get()
            .then(function(querySnapshot) {
                // have all the data, remove all that are too old
                querySnapshot.forEach(function (doc) {
                    // for each log item - delete ones that are too old
                    firebase.firestore()
                        .collection(firebaseData.collectionActivity)
                        .doc(doc.id)
                        .delete()
                        .then(function() {
                            // deleted ok
                        })
                        .catch(function (error) {
                            // error
                            console.log('failed to delete a global log item', error);
                        });
                });
            })
            .catch(function(error) {
                // this didn't work
                console.log("Failed to get the log collection to clean up: ", error);
            });
    },

    addTrackedData : function (user, userData, activity, itemId, itemData) {
        if (user && userData && userData.isTracked) {
            // we are tracking this activity, add to the relevant collection of data, first create the data
            var activityData = this.defaultLogItem(user, userData, activity, itemId, itemData);
            // let the user track their progress
            firebase.firestore()
                .collection(firebaseData.collectionUsers)
                .doc(user.uid)
                .collection(activity)
                .add(activityData)
                .then(function(newDocRef) {
                    // this worked, fine
                    
                })
                .catch(function(error) {
                    // this didn't work
                    console.log("Failed to add the document: ", error);
                });
            // let the global tracking happen
            firebase.firestore()
                .collection(firebaseData.collectionActivity)
                .add(activityData)
                .then(function(newDocRef) {
                    // this worked, fine
                })
                .catch(function(error) {
                    // this didn't work
                    console.log("Failed to add the activity document: ", error);
                });
            // we fired off this request to log the data, we also want to keep this a little clean to remove old
            // requests we are no longer interested in
            if (!this.logsCleaned.includes(activity)) {
                // this wasn't cleaned in this session yet - clean it now
                var deleteDate = new Date();
                // Set it to one month ago
                deleteDate.setMonth(deleteDate.getMonth() - 1);
                var firebaseDeleteDate = firebase.firestore.Timestamp.fromDate(deleteDate);
                // and find everything that is this date or older to delete
                firebase.firestore()
                    .collection(firebaseData.collectionUsers)
                    .doc(user.uid)
                    .collection(activity)
                    .where("at", "<", firebaseDeleteDate)
                    .get()
                    .then(function(querySnapshot) {
                        // have all the data, remove all that are too old
                        querySnapshot.forEach(function (doc) {
                            // for each log item - delete ones that are too old
                            firebase.firestore()
                                .collection(firebaseData.collectionUsers)
                                .doc(user.uid)
                                .collection(activity)
                                .doc(doc.id)
                                .delete()
                                .then(function() {
                                    // deleted ok
                                })
                                .catch(function (error) {
                                    // error
                                    console.log('failed to delete a log item', error);
                                });
                        });
                    })
                    .catch(function(error) {
                        // this didn't work
                        console.log("Failed to get the log collection to clean up: ", error);
                    });

                this.logsCleaned.push(activity);
            }
        }
    },

    updateUserData : function (user, userData, onSuccess, onFailure) {
        this.autoCompleteData(userData);
        firebase.firestore().collection("users").doc(user.uid).update(userData)
            .then(function() {
                // this worked
                onSuccess ? onSuccess() : null;
            })
            .catch(function(error) {
                // this failed
                onFailure ? onFailure(error) : console.log("Failed to update the document: ", error);
            });
    },

    deleteAllUserData : function(user, onSuccess, onFailure) {
        // delete the user document we have stored
        firebase.firestore().collection("users").doc(user.uid).delete().then(function() {
            logout();
        }).catch(function(error) {
            alert("Sorry about this, but there was some error in removing all your data, please contact us to confirm all you data was in-fact removed. Please reference this weird set of letters to help us find it: '" + user.uid + "'." );
            console.error("Error removing document: ", error);
        });
    },
    
    isUserAdmin : function(firebaseUserData) {
        return firebaseUserData['isAdmin'];
    },
    
    isUserReader : function(firebaseUserData) {
        return firebaseUserData['isReader'];
    },

    addNewItemCategory : function(categoryData, onSuccess, onFailure) {
        firebase.firestore().collection(this.collectionCategories).add(categoryData)
            .then(function(newDocRef) {
                // this worked
                onSuccess ?  onSuccess(newDocRef) : null;
            })
            .catch(function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to add the document: ", error);
            });
    },

    addNewItem : function(itemData, onSuccess, onFailure) {
        firebase.firestore().collection(this.collectionItems).add(itemData)
            .then(function(newDocRef) {
                // this worked
                onSuccess ?  onSuccess(newDocRef) : null;
            })
            .catch(function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to add the document: ", error);
            });
    },

    addNewQuantity : function(quantityData, onSuccess, onFailure) {
        firebase.firestore().collection(this.collectionQuantities).add(quantityData)
            .then(function(newDocRef) {
                // this worked
                onSuccess ?  onSuccess(newDocRef) : null;
            })
            .catch(function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to add the document: ", error);
            });
    },

    searchCollectionForWord : function (collectionName, orderTerm, searchTerm, onSuccess, onFailure) {
        if (!searchTerm || searchTerm === "") {
            // there is no term - get everything
            firebase.firestore().collection(collectionName)
                .orderBy(orderTerm)
                .get()
                .then(function (querySnapshot) {
                    // this worked
                    onSuccess ?  onSuccess(querySnapshot) : null;
                })
                .catch(function(error) {
                    // this didn't work
                    onFailure ? onFailure(error) : console.log("Failed to find any matching documents: ", error);
                });
        }
        else {
            firebase.firestore().collection(collectionName).where("words", 'array-contains', firebaseData.lcRef(searchTerm)).get()
                .then(function (querySnapshot) {
                    // this worked
                    onSuccess ?  onSuccess(querySnapshot) : null;
                })
                .catch(function(error) {
                    // this didn't work
                    onFailure ? onFailure(error) : console.log("Failed to find any matching documents: ", error);
                });
            }
    },
    
    getCategoryByName : function(categoryName, onSuccess, onFailure) {
        // return the correct category
        firebase.firestore().collection(this.collectionCategories).where("name_lc", "==", firebaseData.lcRef(categoryName)).get()
            .then(function(querySnapshot) {
                // this worked
                onSuccess ?  onSuccess(querySnapshot) : null;
            })
            .catch(function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to get any matching documents: ", error);
            });
    },
    
    getCategoryById : function(categoryId, onSuccess, onFailure) {
        // return the correct category
        firebase.firestore().collection(this.collectionCategories).doc(categoryId).get()
            .then(function(doc) {
                // this worked
                onSuccess ?  onSuccess(doc) : null;
            })
            .catch(function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to get the document: ", error);
            });
    },
    
    getItemInCategoryByName : function(categoryDocId, itemName, onSuccess, onFailure) {
        // return the correct item
        var categoryRef = firebase.firestore().doc(firebaseData.collectionCategories + '/' + categoryDocId);
        firebase.firestore().collection(this.collectionItems)
            .where("name_lc", "==", firebaseData.lcRef(itemName))
            .where("category_ref", "==", categoryRef).get()
            .then(function(querySnapshot) {
                // this worked
                onSuccess ?  onSuccess(querySnapshot) : null;
            })
            .catch(function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to get any matching documents: ", error);
            });
    },
    
    getItemsInCategory : function(categoryDocId, onSuccess, onFailure) {
        // return the correct items for the category
        var categoryRef = firebase.firestore().doc(firebaseData.collectionCategories + '/' + categoryDocId);
        firebase.firestore().collection(this.collectionItems)
            .where("category_ref", "==", categoryRef).get()
            .then(function(querySnapshot) {
                // this worked
                onSuccess ?  onSuccess(querySnapshot) : null;
            })
            .catch(function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to get any matching documents: ", error);
            });
    },
    
    getItemQuantityByNumber : function(itemDocId, quantityNumber, onSuccess, onFailure) {
        // return the correct item quantity
        var itemRef = firebase.firestore().doc(firebaseData.collectionItems + '/' + itemDocId);
        firebase.firestore().collection(this.collectionQuantities)
            .where("quantity", "==", quantityNumber)
            .where("item_ref", "==", itemRef).get()
            .then(function(querySnapshot) {
                // this worked
                onSuccess ?  onSuccess(querySnapshot) : null;
            })
            .catch(function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to get any matching documents: ", error);
            });
    },
    
    getItemData : function (itemDocId, onSuccess, onFailure) {
        // get the item data from firebase
        firebase.firestore().doc(firebaseData.collectionItems + '/' + itemDocId)
            .get()
            .then(function(doc) {
                if (doc && doc.exists) {
                    // do stuff with the data
                    onSuccess(doc.data());
                } else {
                    // log this
                    console.log("No document data exists for item", itemDocId);
                }
            })
            .catch(function(error) {
                onFailure ? onFailure(error) : console.log("Failed to get the document: ", error);
            });
    },
    
    getQuantitiesInItem : function(itemDocId, onSuccess, onFailure) {
        // return the correct quantities for the item
        var itemRef = firebase.firestore().doc(firebaseData.collectionItems + '/' + itemDocId);
        firebase.firestore().collection(this.collectionQuantities)
            .where("item_ref", "==", itemRef).orderBy('quantity').get()
            .then(function(querySnapshot) {
                // this worked
                onSuccess ?  onSuccess(querySnapshot) : null;
            })
            .catch(function(error) {
                // this didn't work
                onFailure ? onFailure(error) : console.log("Failed to get any matching documents: ", error);
            });
    },

    updateCategoryData : function (categoryDocId, categoryData, onSuccess, onFailure) {
        // we want to auto create the name_lc and the words from the data passed
        this.autoCompleteData(categoryData);
        // and send the update
        firebase.firestore().collection(this.collectionCategories).doc(categoryDocId).update(categoryData)
            .then(function() {
                // this worked
                onSuccess ? onSuccess() : null;
            })
            .catch(function(error) {
                // this failed
                onFailure ? onFailure(error) : console.log("Failed to update the document: ", error);
            });
    },

    deleteCategoryData : function (categoryDocId, onSuccess, onFailure) {
        // delete the category from the store
        firebase.firestore().collection(this.collectionCategories).doc(categoryDocId).delete()
            .then(function() {
                // this worked
                onSuccess ? onSuccess() : null;
            })
            .catch(function(error) {
                // this failed
                onFailure ? onFailure(error) : console.log("Failed to delete the document: ", error);
            });
        const categoryDocRef = firebase.firestore()
            .collection(this.collectionCategories)
            .doc(categoryDocId);
        // and any items for this category
        firebase.firestore().collection(this.collectionItems)
            .where('category_ref', '==', categoryDocRef)
            .get()
            .then((querySnapshot) => {
                // have all the items that reference this category - delete them
                if (querySnapshot) {
                    // so delete them all please...
                    querySnapshot.forEach((doc) => {
                        // delete each document
                        doc.ref.delete()
                            .then()
                            .catch((error) => {
                                console.error('Failed to delete the item', error);
                            });
                    });
                }
                return 1;
            })
            .catch((error) => {
                console.error('Failed to find the item from the target cat of ' + categoryDocId, error);
                return -1;
            });
        // and any quantities for this category
        firebase.firestore().collection(this.collectionQuantities)
            .where('category_ref', '==', categoryDocRef)
            .get()
            .then((querySnapshot) => {
                // have all the quantities that reference this category - delete them
                if (querySnapshot) {
                    // so delete them all please...
                    querySnapshot.forEach((doc) => {
                        // delete each document
                        doc.ref.delete()
                            .then()
                            .catch((error) => {
                                console.error('Failed to delete the quantity', error);
                            });
                    });
                }
                return 1;
            })
            .catch((error) => {
                console.error('Failed to find the quantities from the target cat of ' + categoryDocId, error);
                return -1;
            });
    },

    updateItemData : function (itemDocId, itemData, onSuccess, onFailure) {
        // we want to auto create the name_lc and the words from the data passed
        this.autoCompleteData(itemData);
        // and send the update
        firebase.firestore().collection(this.collectionItems).doc(itemDocId).update(itemData)
            .then(function() {
                // this worked
                onSuccess ? onSuccess() : null;
            })
            .catch(function(error) {
                // this failed
                onFailure ? onFailure(error) : console.log("Failed to update the document: ", error);
            });
    },

    deleteItemData : function (itemDocId, onSuccess, onFailure) {
        // delete the item from the store
        firebase.firestore().collection(this.collectionItems).doc(itemDocId).delete()
            .then(function() {
                // this worked
                onSuccess ? onSuccess() : null;
            })
            .catch(function(error) {
                // this failed
                onFailure ? onFailure(error) : console.log("Failed to delete the document: ", error);
            });
        const itemDocRef = firebase.firestore()
            .collection(this.collectionItems)
            .doc(itemDocId);
        // and any quantities for this item
        firebase.firestore().collection(this.collectionQuantities)
            .where('item_ref', '==', itemDocRef)
            .get()
            .then((querySnapshot) => {
                // have all the quantities that reference this item - delete them
                if (querySnapshot) {
                    // so delete them all please...
                    querySnapshot.forEach((doc) => {
                        // delete each document
                        doc.ref.delete()
                            .then()
                            .catch((error) => {
                                console.error('Failed to delete the quantity', error);
                            });
                    });
                }
                return 1;
            })
            .catch((error) => {
                console.error('Failed to find the quantities from the target item of ' + itemDocId, error);
                return -1;
            });
    },

    updateQuantityData : function (quantityDocId, quantityData, onSuccess, onFailure) {
        // we want to auto create the name_lc and the words from the data passed
        this.autoCompleteData(quantityData);
        // and send the update
        firebase.firestore().collection(this.collectionQuantities).doc(quantityDocId).update(quantityData)
            .then(function() {
                // this worked
                onSuccess ? onSuccess() : null;
            })
            .catch(function(error) {
                // this failed
                onFailure ? onFailure(error) : console.log("Failed to update the document: ", error);
            });
    },

    deleteQuantityData : function (quantityDocId, onSuccess, onFailure) {
        // delete the quantity from the store
        firebase.firestore().collection(this.collectionQuantities).doc(quantityDocId).delete()
            .then(function() {
                // this worked
                onSuccess ? onSuccess() : null;
            })
            .catch(function(error) {
                // this failed
                onFailure ? onFailure(error) : console.log("Failed to delete the document: ", error);
            });
    },
};