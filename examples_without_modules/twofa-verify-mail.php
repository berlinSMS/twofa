<h3>Register with TwoFA via mail</h3>

<?php

include 'config.php';

if (!isset($_POST['button']) || $_POST['button'] != 'register') {

?>

<form id="register-form" method="post">

    <br /><label for="username">Username</label>
    <br /><input name="username" type="text" placeholder="Choose a user name" />

    <br /><label for="password">Password</label>
    <br /><input name="password" type="text" placeholder="Choose a password" />

    <br /><label for="mailaddress">Mail address</label>
    <br /><input name="mailaddress" type="text" placeholder="Enter your mail address" id="mailaddress" />
    <button id="verify" type="submit" onclick="startVerify(); return false;">Verify</button>

    <br /><button id="submit" type="submit" name="button" value="register" disabled>Register</button>
</form>

<script language="javascript">
    const captchaSitekey = "<?php echo RECAPTCHA_SITE_KEY; ?>";
    const twofaSitekey   = "<?php echo TWOFA_SITE_KEY;     ?>";

    function startVerify() {
        //hide verify-button
        document.getElementById("verify").style.visibility = 'hidden';
        document.getElementById("mailaddress").readOnly = true;

        //add captcha-js
        var js = document.createElement("script");
        js.type = 'text/javascript';
        js.src  = 'https://www.google.com/recaptcha/api.js';
        document.body.appendChild(js);

        //show captcha
        const captchaDiv = document.createElement("div")
        captchaDiv.id = "captcha";
        captchaDiv.setAttribute('class', 'g-recaptcha')
        captchaDiv.setAttribute('data-sitekey', captchaSitekey)
        captchaDiv.setAttribute('data-callback', 'sendCode');
        document.getElementById("register-form").appendChild(captchaDiv);
    }
    function sendCode(captchaToken) {
        //make rest-call to sendCode
        const params = new URLSearchParams({
            twofaSitekey: twofaSitekey,
            captchaToken: captchaToken,
            mailaddress: document.getElementById("mailaddress").value
        });
        const url = 'https://api.berlinsms.de/twofa/sendmail?' + params.toString();
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                requestCode(JSON.parse(this.responseText).challengeToken);
            }
        };
        xhr.send();
    }
    function requestCode(challengeToken) {
        //hide captcha
        document.getElementById('captcha').style.visibility = 'hidden';

        //save challengeToken in hidden input
        challengeInput = document.createElement('input');
        challengeInput.id = 'challengeToken';
        challengeInput.setAttribute('type', 'hidden');
        challengeInput.setAttribute('name', 'challengeToken');
        challengeInput.setAttribute('value', challengeToken);
        document.getElementById("register-form").appendChild(challengeInput);

        //show code-input
        const codeInput = document.createElement("input")
        codeInput.id = "mailCode";
        codeInput.setAttribute('name', 'mailCode');
        codeInput.setAttribute('placeholder', 'mailCode');
        codeInput.addEventListener("input", codeEntered);
        document.getElementById("register-form").appendChild(codeInput);
    }
    function codeEntered(event) {
        event.preventDefault();
        //check if code is complete
        const codeInput = document.getElementById("mailCode");
        if (codeInput.value.length == 6) verifyCode();
    }
    function verifyCode() {

        //hide code-input
        const codeInput = document.getElementById("mailCode");
        codeInput.style.visibility = 'hidden';

        //make rest-call to preverify code
        const params = new URLSearchParams({
            twofaSitekey: twofaSitekey,
            challengeToken: document.getElementById("challengeToken").value,
            code: codeInput.value
        });
        const url = 'https://api.berlinsms.de/twofa/preverifycode?' + params.toString();
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                //enable submit-button
                document.getElementById("submit").disabled = false;
                //show ok
                document.getElementById("register-form").append("verified");
            }
        };
        xhr.send();
    }
</script>

<?php
    exit(0);
}


if (!isset($_POST['challengeToken'])) {
    echo 'Error: no challengeToken in response';
    exit(0);
}

$url = "https://api.berlinsms.de/twofa/challenge"
    . '?twofaSecretkey=' . urlencode(stripslashes(TWOFA_SECRET_KEY))
    . '&challengeToken=' . urlencode(stripslashes($_POST['challengeToken']));

$response = file_get_contents($url);
$responseJson = json_decode($response, true);

if (isset($responseJson['error'])) {
    echo 'Error: ' . $responseJson['error'];

} else if (!isset($responseJson['solved']) || !$responseJson['solved'] || !isset($responseJson['verifiedAddress'])) {
    echo "<hr>twofa verification failed";

} else {
    echo "<hr>twofa verifcation successful <br>" . $responseJson['verifiedAddress'] . " is the verified mail address";
}

?>