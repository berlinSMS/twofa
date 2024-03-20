<h3>Register with TwoFA via mail using modules</h3>

<?php

include '../twofa.php';
include 'mail.config.php';

if (!isset($_POST['button']) || $_POST['button'] != 'register') {

?>

    <form id="register-form" method="post">

        <br /><label for="username">Username</label>
        <br /><input name="username" type="text" placeholder="Choose a user name" />

        <br /><label for="password">Password</label>
        <br /><input name="password" type="text" placeholder="Choose a password" />

        <script src="../twofa-optin.js?bsmsSitekey=<?php echo TWOFA_SITE_KEY; ?>&onSolved=onSolvedCallback"></script>
        <script language="javascript">
            function onSolvedCallback() {
                document.getElementById("submit").disabled = false;
            }
        </script>

        <br /><button id="submit" type="submit" name="button" value="register" disabled>Register</button>
    </form>

    <?php
    exit(0);
}


if (!isset($_POST['challengeToken'])) {
    echo 'Error: no challengeToken in response';
    exit(0);
}

$twofa = new Twofa(TWOFA_SITE_KEY, TWOFA_SECRET_KEY);
$twofaChallenge = $twofa->getTwofaChallenge($_POST['challengeToken']);

if ($twofaChallenge->hasError()) {
    echo 'Error: ' . $twofaChallenge->getError();

} else if (!$twofaChallenge->isSolved()) {
    echo "<hr>twofa verification failed";

} else {
    echo "<hr>twofa verifcation successful <br>" . $twofaChallenge->getVerifiedAddress() . " is the verified phone number";
}

?>