<h3>Login with TwoFA via sms using modules</h3>

<?php

include '../twofa.php';
include 'sms.config.php';

$twofa = new Twofa(TWOFA_SITE_KEY, TWOFA_SECRET_KEY);

if (
    isset($_POST['button']) &&
    $_POST['button'] == 'login'
) {

    $phonenumber = SAMPLE_ACCOUNT_PHONE_NUMBER; //add code to get assigned phonenumber here;
    $postTwofaSendsmsResponse = $twofa->postTwofaSendsms($phonenumber);

    if ($postTwofaSendsmsResponse->hasError()) {
        echo 'Error: ' . $postTwofaSendsmsResponse->getError();
        exit(0);
    }
    $challengeToken = $postTwofaSendsmsResponse->getChallengeToken();

    ?>

    <form id="code-form" method="post">
        <input type="hidden" name="challengeToken" value="<?php echo $challengeToken; ?>" />

        <br /><label for="code">Code sent to <?php echo $phonenumber; ?></label>
        <br /><input id="code" name="code" placeholder="Enter Code" type="text" maxlength="6" oninput="codeEntered" />

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

    $twofaChallenge = $twofa->putTwofaPreverifycode($_POST['challengeToken'], $_POST['code']);

    if ($twofaChallenge->hasError()) {
        echo 'Error: ' . $twofaChallenge->getError();

    } else if ($twofaChallenge->getSolved()) {
        echo 'Succesfully login as ' . $twofaChallenge->getVerifiedAddress();

    } else {
        echo 'Login failed, not verified: ' . $twofaChallenge->getError();

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