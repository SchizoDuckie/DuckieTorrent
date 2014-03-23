DuckieTorrent
=============

W.I.P. Trying to mimic btapp.js in angularjs service and provide a clean service interface to connect to uTorrent / Bittorent and execute RPC calls via the
interface provided.

This means that you can control Utorrent (starting from v3.3) from your angular app.

Features:
* Port scan for a listening torrent client
* Authenticate app
* Connect to API
* Fetch torrent list
* Show files
* Show download progress

* Call Remote Procedures on connected client
* Allow streaming via html5 <video>
* Launch files via native player
* Start / Stop / Add / Remove torrents

Future features:
* Set uTorrent configs
* Updates of progress while downloading

Screenshot
==========
!['DuckieTorrent Angular'](http://i.imgur.com/MMvGwX4.png)

Live Demo
=========
http://schizoduckie.github.io/DuckieTorrent/
