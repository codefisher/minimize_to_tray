minimize: function(event) {
	var win = event.target.ownerDocument.defaultView;
	var miner = MinimizerFactory(win);
	miner.minimize();
}
