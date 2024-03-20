<h3>Login with TwoFA via sms</h3>

<?php

include 'config.php';

if (
    isset($_POST['button']) &&
    $_POST['button'] == 'login'
) {

    $phonenumber = SAMPLE_ACCOUNT_PHONE_NUMBER; //add code to get assigned phone number here;
    $url = "https://api.berlinsms.de/twofa/sendsms"
        . '?twofaSecretkey=' . urlencode(stripslashes(TWOFA_SECRET_KEY))
        . '&phonenumber=' . urlencode(stripslashes($phonenumber));

    $ch = curl_init($url);
    curl_setopt_array($ch,
        array(
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_HTTPHEADER => array('Content-type: application/json')
        )
    );
    $response = (string) curl_exec($ch);
    curl_close($ch);

    $responseJson = json_decode($response, true);

    if (isset($responseJson['error'])) {
        echo 'Error: ' . $responseJson['error'];
        exit(0);
    }
    if (!isset($responseJson['challengeToken'])) {
        echo 'Error getting challengeToken';
        exit(0);
    }
    $challengeToken = $responseJson["challengeToken"];

?>

    <form id="code-form" method="post">
        <input type="hidden" name="challengeToken" value="<?php echo $challengeToken; ?>" />

        <br /><label for="code">Code sent to <?php echo $phonenumber; ?></label>
        <br /><input id="code" name="code" placeholder="Code" type="text" maxlength="6" />

        <br /><button id="submit" type="submit" name="button" value="verifyCode">Verify Code</button>
    </form>

    <?php
    exit(0);

}

if (
    isset($_POST['button']) &&
    $_POST['button'] == 'verifyCode' &&
    isset($_POST['code']) &&
    isset($_POST['challengeToken'])
) {

    $url = "https://api.berlinsms.de/twofa/preverifycode"
        . '?twofaSitekey=' . urlencode(stripslashes(TWOFA_SITE_KEY))
        . '&challengeToken=' . urlencode(stripslashes($_POST['challengeToken']))
        . '&code=' . urlencode(stripslashes($_POST['code']));

    $ch = curl_init($url);
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_CUSTOMREQUEST => 'PUT',
        CURLOPT_HTTPHEADER => array('Content-type: application/json')
    )
    );
    $response = (string) curl_exec($ch);
    curl_close($ch);

    $responseJson = json_decode($response, true);

    if (isset($responseJson['error'])) {
        echo 'Error: ' . $responseJson['error'];

    } else if (!isset($responseJson['solved']) || !$responseJson['solved'] || !isset($responseJson['verifiedAddress'])) {
        echo 'Login failed';

    } else {
        echo 'Succesfully login as ' . $responseJson['verifiedAddress'];

    }

    exit(0);

}
?>

<form id="login-form" method="post">

    <br /><label for="username">Username</label>
    <br /><input name="username" placeholder="Username" type="text" />

    <br /><label for="password">Password</label>
    <br /><input name="password" placeholder="Password" type="text" />
    <br />(any credentials will do, no actual login is performed in this example)

    <br /><button id="submit" type="submit" name="button" value="login">Login</button>
</form>