<?php
if($_SERVER['REQUEST_METHOD'] === 'POST') {
  $post_error = $first_load = $email_validated = $pass_validated = false;
  $email = $password = $post_error_reason = '';

  if(!empty($_POST['epost'])) {
    $email = preg_replace('/\s+/', '', $_POST['epost']);
    if(preg_match('/^[^@]+@[^@.]+[.][^@]+$/', $email)) {
      $email_validated = true;
    }
  }

  if(!empty($_POST['passord'])) {
    $password = $_POST['passord'];
    if(preg_match('/^.{5,}$/', $password)) {
      $password_validated = true;
    }
  }

  if($email_validated && $password_validated) {
    session_start();
    $_SESSION['use'] = true;
    $_SESSION['email'] = $email;
    header('Location: approved.php');
    exit();
  }
} else {
  $first_load = true;
}
?>

<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Innlogging med PHP</title>
  <link rel="stylesheet" href="css/main.css">
  <link rel="stylesheet" href="css/formValidation.css">
  <script async defer src="js/main.js"></script>
  <script async defer src="js/formValidation.js"></script>
</head>
<body>
  <img id="background" class="background" src="img/Mount-Hallwill-Norway-Spitsbergen-20180120-tiny.jpg" alt="'Mount Hallwill' av Ethan Welty - Aurora Photos">
  <form class="skjema" style="display:none;" action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]);?>" method="post">
    <input style="display:none;" id="firstload"
    value="<?php echo $first_load; ?>">

    <?php
    if($post_error) {
      echo '<p class="loginerror">Kunne ikke logge inn: $post_error_reason</p>';
    }
    ?>

    <div class="input-container">
    <input
      type="text" name="epost" id="email"
      required pattern="^[^@\s]+@[^@\s]+\.[^@\s]+$"
      placeholder="Epost"
      value="<?php echo htmlspecialchars($email); ?>">
    </div>

    <div class="input-container">
    <input
      type="password" name="passord" id="password"
      pattern=".{5,}"
      required placeholder="Passord"
      value="<?php echo htmlspecialchars($password); ?>">
    </div>

    <input
      type="submit" name="logg-inn" id="submit"
      onclick="return localValidate(this.parentNode)"
      value="Logg inn">

    <!--
    <?php
      echo "<p>epost: \"" . $_SESSION['email'] . "\" - gyldig: " . ($email_validated ? 'yep' : 'nope') . " | "
         . "passord: \"" . $_SESSION['password'] . "\" - gyldig: " . ($password_validated ? 'yep' : 'nope') . "</p>";
      ?>
    -->
  </form>
</body>
</html>
