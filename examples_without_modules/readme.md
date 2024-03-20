# Integrating Two-Factor Authentication (TwoFA) into Your Own Web App

To access their account, users need to input their login credentials for Two-Factor Authentication (TwoFA), followed by receiving an SMS containing a one-time code on their mobile phone or tablet. Upon correctly entering both security queries, users are permitted to log into their account.

As a developer of a web app, you can enhance the registration and login process for users by implementing TwoFA via SMS:

## 1) Obtaining Keys

Obtain the SiteKey and SecretKey for your app's domain. You can find detailed instructions [here](https://www.berlinsms.de/fuer-entwickler/dokumentation/sitekey-secretkey-generieren/).

Also, provide the SiteKey and SecretKey for your Captcha provider if you intend to augment the registration process with TwoFA as described above.

## 2) Verification in the Registration Process

To implement verification in the registration process, you need to add an additional field for the phone number in your registration form.

<div class="tabs">
<details open><summary>.html</summary>

``` { .html }
<form>
  <br/><label for="phonenumber">Phone Number</label>
  <br/><input id="phonenumber" type="text"/>
  <br/><button id="submit" type="submit>Register</button>
</form>
```

</details>
</div>

Verification of the phone number occurs in the frontend. Add an additional button labeled "Verify" and customize its click event to prevent the form from being submitted as originally configured.

<div class="tabs">
<details open><summary>.html</summary>

```{ .html }
    <button id="verify"
        onclick="startVerify();return false;">Verify</button>
```

</details>
<details><summary>.jsx</summary>

```{ .jsx }
    <button id="verify" 
        onClick={(event)=>{event.preventDefault();startVerify();}}>Verify</button>
```

</details>
</div>

### Sending SMS

Clicking the "Verify" button triggers sending an SMS to the entered phone number. However, it's strongly recommended to implement a Captcha to prevent spam registrations, unnecessary SMS sending, and significant costs.

<div class="tabs">
<details open><summary>.js</summary>

```{ .js }
    var js = document.createElement("script");
    js.type = 'text/javascript';
    js.src  = 'https://www.google.com/recaptcha/api.js';
    document.body.appendChild(js);
    
    const captchaDiv = document.createElement("div")
    captchaDiv.id = "captcha";
    captchaDiv.setAttribute('class', 'g-recaptcha')
    captchaDiv.setAttribute('data-sitekey', 'YOUR_CAPTCHA_SITE_KEY')
    captchaDiv.setAttribute('data-callback', 'sendCode'); //<-sendCode is the function to call after captcha is solved
    document.getElementById("register-form").appendChild(captchaDiv);
```

</details>
</div>

After solving the Captcha, you can initiate the sending of the code. Utilizing the route "POST/twofa/sendsms" for this purpose.

<div class="tabs">
<details open><summary>.js</summary>

```{ .js }
    function sendCode(captchaToken) {
        //make rest-call to sendCode
        const params = new URLSearchParams({
            twofaSitekey: "YOUR_TWOFA_SITE_KEY""", 
            captchaToken: captchaToken, 
            phonenumber: document.getElementById("phonenumber").value
        });
        const url = 'https://api.berlinsms.de/twofa/sendsms?' +
            params.toString();
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                requestCode(JSON.parse(this.responseText).challengeToken);//<-requestCode is the function to call after code is sent
            }
        };
        xhr.send();
    }
```

</details>
</div>

### Handling Code Entry

Store the challenge token in between, for example, in a hidden input field of your form.

<div class="tabs">
<details open><summary>.js</summary>

```{ .js }
    challengeInput = document.createElement('input');
    challengeInput.id = 'challengeToken'; 
    challengeInput.setAttribute('type', 'hidden'); 
    challengeInput.setAttribute('name', 'challengeToken'); 
    challengeInput.setAttribute('value', challengeToken); 
    document.getElementById("register-form").appendChild(challengeInput);
```

</details>
</div>

Provide your app users with a field where they can enter the code received from the SMS. Integrate an event handler into this field to respond to code entry.

<div class="tabs">
<details open><summary>.js</summary>

```{ .js }
    const codeInput = document.createElement("input")
    codeInput.id = "smsCode";
    codeInput.setAttribute('name', 'smsCode');
    codeInput.setAttribute('placeholder', 'smsCode');
    codeInput.addEventListener("input", codeEntered); 
    document.getElementById("register-form").appendChild(codeInput);
```

</details>
</div>

You can provide your users with a button to submit the code, or automatically start the verification process after entering 6 characters.

<div class="tabs">
<details open><summary>.js</summary>

```{ .js }
    function codeEntered() {
        if (codeInput.value.length == 6) verifyCode();
    }
```

</details>
</div>

To verify the entered string, use the "PUT/twofa/preverifycode" route.

<div class="tabs">
<details open><summary>.js</summary>

```{ .js }
    function verifyCode() {
        
        //hide code-input
        codeInput.style.visibility = 'hidden'; 

        //make rest-call to preverify code
        const params = new URLSearchParams({
            twofaSitekey: 'YOUR_TWOFA_SITE_KEY', 
            challengeToken: document.getElementById("challengeToken").value, 
            code: codeInput.value
        });
        const url = 'https://api.berlinsms.de/twofa/preverifycode?' + pa-rams.toString();
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                //Rest-Call successfull, challengge solved
            }
        };
        xhr.send();
    }
```

</details>
</div>

Once the REST call returns, enable the registration button.

<div class="tabs">
<details open><summary>.js</summary>

```{ .js }
    document.getElementById("submit").disabled = false;
```

</details>
</div>

When the user clicks on the registration button, the form will be submitted, and the user will be created.

## 3) Backend Verification

After submitting the form, the backend receives the Challenge Token. Since frontend data can be manipulated, it's strongly recommended to verify the Challenge Token on the server-side. Use the "PUT/twofa/verifycode" route for this purpose.

<div class="tabs">
<details open><summary>.php</summary>

``` { .php }
    $url = "https://api.berlinsms.de/twofa/challenge"
    . '?twofaSecretkey=YOUR_TWOFA_SECRET_KEY'
    . '&challengeToken=' . urlencode(stripslashes($challengeToken));

    $response = file_get_contents($url);
    $responseJson = json_decode($response, true);

    if (trim($responseJson['solved']) == true) {
        echo 'Phonenumber '. $responseJson['verifiedAddress'] . ' verified';
        //Add code to create user account here, assign the verified phonenumber
    }
    else {
        echo 'not verified';
    }
``` 

</details>
<details><summary>.js</summary>

``` { .js }
    var url = 'https://api.berlinsms.de/twofa/challenge'
            + '?twofaSecretkey=YOUR_TWOFA_SECRET_KEY'
            + '&challengeToken=' + encodeURIComponent(challengeToken);
    const fetch = await import('node-fetch');
	const response = await fetch.default(url);
    const responseJson = JSON.parse(await response.text());

    if (responseJson?.solved) {
        console.log( 'Phonenumber '+ responseJson.verifiedAddress + ' verified' );
        //Add code to create user account here, assign the verified phonenumber
    }
    else {
        console.log( 'not verified' );
    }
``` 

</details>
</div>

You can now create the user and link the phone number. Please always use the returned number (verifiedAddress) to prevent possible manipulations in the form.

## 4) Authentication in the Login Process

To implement phone number authentication in the login process, add another security query after verifying the username and password. Retrieve the user's phone number, for example, from your database. Then, send a code via SMS to this number. Utilizing the route "POST/twofa/sendsms" for this purpose.

The user now receives a code via SMS to the phone number provided by them. As a result, you will receive a JSON with a challenge token.

<div class="tabs">
<details open><summary>.php</summary>

``` { .php }
    $url = "https://api.berlinsms.de/twofa/sendsms"
      . '?twofaSecretkey=TWOFA_SECRET_KEY'
      . '&phonenumber=' . $phonenumber;
    
    $ch = curl_init($url);
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_CUSTOMREQUEST => 'POST',
        CURLOPT_HTTPHEADER => array('Content-type: application/json')
    ));
    $response = (string) curl_exec($ch);
    curl_close($ch);
    
    $responseJson = json_decode($response, true);
    $challengeToken = $responseJson["challengeToken"];
```

</details>
<details><summary>.js</summary>

``` { .js }
    url = 'https://api.berlinsms.de/twofa/sendsms'
        + '?twofaSecretkey=' + YOUR_TWOFA_SECRET_KEY
        + '&phonenumber=' + phonenumber;
    
    const fetch = await import('node-fetch');
    const response = await fetch.default(url, { method: 'POST' });

    const responseJson = JSON.parse(await response.text());
    challengeToken = responseJson.challengeToken;
``` 

</details>
</div>

The user enters the code from the SMS into a form provided by you. Simultaneously, pass the Challenge Token as a hidden input.

<div class="tabs">
<details open><summary>.html+.php</summary>

``` { .html }
    <form id="code-form" method="post" action="login.php">
        <input type="hidden" name="challengeToken" value="<?php echo $responseJson["challengeToken"]; ?>" />
        <br /><label for="code">Code</label>
        <br /><input id="code" name="code" placeholder="Code" type="number" size="6" oninput="codeEntered" />
        <br /><button id="submit" type="submit">Verify Code</button>
    </form>
```

</details>
</div>

You can now verify the entered code.

<div class="tabs">
<details open><summary>.php</summary>

``` { .php }
    $url = "https://api.berlinsms.de/twofa/preverifycode"
      . '?twofaSitekey='   . urlencode(stripslashes(TWOFA_SITE_KEY))
      . '&challengeToken=' . urlencode(stripslashes($_POST['challengeToken']))
      . '&code='           . urlencode(stripslashes($_POST['code']));

    $ch = curl_init($url);
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_CUSTOMREQUEST => 'PUT',
        CURLOPT_HTTPHEADER => array('Content-type: application/json')
    ));
    $response = (string) curl_exec($ch);
    curl_close($ch);
```

</details>
<details><summary>.js</summary>

``` { .js }
    url = "https://api.berlinsms.de/twofa/preverifycode"
      + '?twofaSitekey='   . YOUR_TWOFA_SITE_KEY
      + '&challengeToken=' . challengeToken
      + '&code='           . code;
    
    const fetch = await import('node-fetch');
    const response = await fetch.default(url, { method: 'PUT' });
```

</details>
</div>

If the verification is successful, you will receive a JSON in the response with the value "true" in the "solved" field. The phone number is verified.

<div class="tabs">
<details open><summary>.php</summary>

``` { .php }
	$responseJson = json_decode($response, true);

	if (trim($responseJson['solved']) == true) {
		echo 'Phonenumber '. $responseJson['verifiedAddress'] . ' verified';
		//Add code to login user here
	}
	else {
		echo 'not verified';
	}
```

</details>
<details><summary>.js</summary>

``` { .js }
	const responseJson = JSON.parse(await response.text());
	if (responseJson.solved) {
		echo 'Phonenumber '. responseJson.verifiedAddress . ' verified';
		//Add code to login user here
	}
	else {
		echo 'not verified';
	}
```

</details>
</div>

Now you can log in the user. You can find the complete code of this tutorial for download [here](https://github.com/berlinSMS/twofa/tree/main/examples_without_modules).