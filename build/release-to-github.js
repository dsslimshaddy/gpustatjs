const github = require( 'octonode' );
const fs = require( 'fs' );
const path = require( 'path' );

var client = github.client( process.env.GITHUB_AUTH );
var ghrepo = client.repo( 'dsslimshaddy/gpustatjs' );

var version = process.env.CIRCLE_TAG;
ghrepo.release({
  tag_name: version,
  draft: true,
  name: version
}, function( err, data ) {
  if ( err ) {
    throw new Error( err );
  }
  var id = data.id;

  var p = path.join( __dirname,
      '../dist/gpustatjs-' + version.substring( 1 ) + '-amd64.deb' );
  var archive = fs.readFileSync( p );

  var options = {
    name: 'gpustatjs-' + version.substring( 1 ) + '-amd64.deb'
  };

  var ghRelease = client.release( 'dsslimshaddy/gpustatjs', id );
  ghRelease.uploadAssets( archive, options, function( err, data ) {
    if ( err ) {
      throw new Error( err );
    }

    console.log( data );
    return;
  });
});