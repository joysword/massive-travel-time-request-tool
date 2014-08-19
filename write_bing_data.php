<?php
/*
 *	Copyright (c) 2014 Shi Yin
 *	Copyright (c) 2012 Cyrille Médard de Chardon, Geoffrey Caruso
 *	Licensed under the MIT license - see Licence.txt
 *
 *	write_bing_data.php is called through AJAX from main html
 */

$data = $_POST['results'];
$filename = $_POST['file'];
$data_type = $_POST['type'];

//sanitization
//filename must contain only - and [0-9], preg_replace omits all other characters
$clean_filename = preg_replace('/[^0-9\-]/', '', $filename);

//content must contain only \t, commas (,), digits, periods/decimal (.).
$clean_data = preg_replace('/[^0-9\t\-\.\n,]/', '', $data);

//echo $clean_data . " VS " . $data;
//echo $clean_filename . " VS " . $filename;

if ($clean_filename != $filename || $clean_data != $data) {
	//do not create or append to any file, any data
	echo("The input data cannot be written to the server. If you believe this to be a bug please contact the developer.");
	return;
}

echo("filename(php):"+$filename);

//open appropriate file for writing only
switch ($data_type) {
	case 'main':
		$fp = fopen('output/' . $filename . '_maindata.txt', 'a');
		break;
		
	case 'path':
		$fp = fopen('output/' . $filename . '_pathdata.txt', 'a');
		break;
}

//write data to file
fwrite($fp, $data . "\n");

//close file
fclose($fp);

?>