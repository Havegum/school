<?php
session_start();
if(empty($_SESSION['email'])) {
  header('Location: index.php');
  exit();
}
?>

<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Yes!</title>
    <link rel="stylesheet" href="css/main.css">
    <script async defer src="js/main.js"></script>
    <script async defer src="js/approved.js"></script>
  </head>
  <body>
    <img id="background" class="background" src="img/Mount-Hallwill-Norway-Spitsbergen-20180120-tiny.jpg" alt="'Mount Hallwill' av Ethan Welty - Aurora Photos">
    <div class="main" style="display:none;">
      <img src="https://i.imgur.com/bDnPcxV.gif" alt="Innlogging godkjent">
      <p>Du logget inn med: <span class="red"><?php echo htmlspecialchars($_SESSION['email']) ?></span></p>
      <a class="button" onclick="slideOut(this.parentNode);" href="./logout.php">Logg ut</a>
    </div>
  </body>
</html>
