
# Integrating Two-Factor Authentication (TwoFA) into Your Own Web App

To access their account, users must first enter their login credentials when using Two-Factor Authentication (TwoFA). In an additional step, they receive an SMS containing a one-time code on their mobile phone or tablet. After correctly entering both security queries, users are allowed to log into their account.

As a developer of a web app, you can now enhance the registration and login process for users by adding TwoFA via SMS:
1)	Verification: During the registration process, verify the phone number provided by the user. If the user can enter the one-time code received, they confirm the authenticity of their registered number. You can skip this step if you already know all potential visitors and their respective phone numbers through other processes.
2)	Authentication: During the login process, verify the already linked phone number to ensure that the user can still access the linked phone number.
		
## 1) Obtaining Keys

Obtain the SiteKey and the SecretKey for your app's domain. You can find detailed instructions [here](https://www.berlinsms.de/fuer-entwickler/dokumentation/sitekey-secretkey-generieren/). 

Also, provide the SiteKey and SecretKey for your captcha provider if you want to supplement the registration process with TwoFA as described above.

## 2) Verification in the Registration Process

To implement verification in the registration process, you need an additional field for the phone number in your registration form. Add the js module "twofa-optin.js" before the submit button and include the SiteKey parameter you received in step 1.

<div class="tabs">
<details open><summary>.php</summary>

``` { .php }
    <script src="https://static.berlinsms.de/twofa/twofa-optin.js?bsmsSitekey=<?php echo TWOFA_SITE_KEY; ?>&onSolved=onSolvedCallback"></script>
```

</details>
</div>

The module provides an input field for phone numbers and handles the validation in the frontend. It also adds a Hidden Input with a challenge token to the form. Only after correctly entering the code sent via SMS, a registration button will be enabled. Optionally, you can add a callback that is only triggered after confirmation of the code.

<div class="tabs">
<details open><summary>.js</summary>

``` { .js }
	<script language="javascript">
		function onSolvedCallback() {
			document.getElementById("submit").disabled = false;
		}
	</script>
```

</details>
</div>

When the user clicks the registration button, the form is submitted, and the user can be registered.

## 3) Verification in the Backend

After submitting the form, the backend receives the challenge token. Since data in the frontend can be manipulated, it is strongly recommended to validate the challenge token on the server side. Use the "Twofa" module, which you can download [here](https://static.berlinsms.de/twofa/twofa.zip). Save the module in your web space and import it into your backend code.

<div class="tabs">
<details open><summary>.php</summary>

``` { .php }
	include '../twofa.php';
```

</details>
</div>

Create an instance of the "Twofa" class, passing the SiteKey and SecretKey to the constructor.

<div class="tabs">
<details open><summary>.php</summary>

``` { .php }
	$twofa = new Twofa( TWOFA_SITE_KEY, TWOFA_SECRET_KEY );
```

</details>
</div>

Retrieve the challenge information using the "getTwofaChallenge" member function. This function expects the challenge token as a parameter.

<div class="tabs">
<details open><summary>.php</summary>

``` { .php }
	$twofaChallenge = $twofa->getTwofaChallenge($_POST['challengeToken']);
```

</details>
</div>

The returned object contains the verified phone number in the "solved" parameter and information about whether the challenge was successfully solved.

<div class="tabs">
<details open><summary>.php</summary>

``` { .php }
	if ($twofaChallenge->hasError()) {
		echo 'Error: ' . $twofaChallenge->getError();

	} else if (!$twofaChallenge->isSolved()) {
		echo "<hr>twofa verification failed";

	} else {
		echo "<hr>twofa verifcation successful <br>" . $twofaChallenge->getVerifiedAddress() . " is the verified phone number";
	}
```

</details>
</div>

Now you can create the user and link the phone number. Remember to only use the returned phone number. Phone numbers entered in the frontend or form can be manipulated.

## 4) Authentication in the Login Process

To implement phone number authentication in the login process, add another security check after verifying the username and password: Retrieve the user's phone number, for example, from your database. Then, send a code via SMS to this number.

Again, use the "Twofa" module. If not done yet, you can download it [here](https://static.berlinsms.de/twofa/twofa.zip). Save the module in your web space, import it into your backend code, and create an instance of the "Twofa" class, passing the SiteKey and SecretKey to the constructor.

<div class="tabs">
<details open><summary>.php</summary>

``` { .php }
	include '../twofa.php';
	$twofa = new Twofa( TWOFA_SITE_KEY, TWOFA_SECRET_KEY );
```

</details>
</div>

Initiate the verification process with the "postTwofaSendsms" member function. This function expects the phone number to be checked.

<div class="tabs">
<details open><summary>.php</summary>

``` { .php }
	$postTwofaSendsmsResponse = $twofa->postTwofaSendsms($phonenumber);
```

</details>
</div>

The user now receives a code via SMS to the provided phone number. As a result, you get an object with a challenge token.

Next, the user enters the code from the SMS into a form provided by you. At the same time, the challenge token is passed as a Hidden Input.

<div class="tabs">
<details open><summary>.php</summary>

``` { .php }
    <form id="code-form" method="post" action="login.php">
        <input type="hidden" name="challengeToken" value="<?php echo $postTwofaSendsmsResponse->getChallengeToken(); ?>" />
        <br /><label for="code">Code</label>
        <br /><input id="code" name="code" placeholder="Code" type="number" size="6" oninput="codeEntered" />
        <br /><button id="submit" type="submit">Verify Code</button>
    </form>
```

</details>
</div>

You can now verify if both parameters - user input and challenge token - match using the "putTwofaPreverifycode" member function.

<div class="tabs">
<details open><summary>.php</summary>

``` { .php }
	$twofaChallenge = $twofa->putTwofaPreverifycode($_POST['challengeToken'], $_POST['code']);
```

</details>
</div>

The returned object contains the verified phone number and the "solved" parameter, indicating whether the challenge was successfully solved.

<div class="tabs">
<details open><summary>.php</summary>

``` { .php }
	if ($twofaChallenge->hasError()) {
        echo 'Error: ' . $twofaChallenge->getError();

    } else if ($twofaChallenge->getSolved()) {
        echo 'Succesfully login as ' . $twofaChallenge->getVerifiedAddress();

    } else {
        echo 'Login failed, not verified: ' . $twofaChallenge->getError();

    }
```

</details>
</div>

You can now log in the user.

You can find the complete code of this tutorial for download [here](https://static.berlinsms.de/twofa/twofa_with_modules.zip)