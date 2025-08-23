// ==UserScript==
// @name         SBG CUI fix
// @namespace    https://sbg-game.ru/app/
// @version      25.8.3
// @downloadURL  https://github.com/egorantonov/sbg-enhanced/releases/latest/download/cui.user.js
// @updateURL    https://github.com/egorantonov/sbg-enhanced/releases/latest/download/cui.user.js
// @description  SBG Custom UI
// @author       NV
// @match        https://sbg-game.ru/app/*
// @run-at       document-idle
// @grant        none
// @iconURL      https://nicko-v.github.io/sbg-cui/assets/img/tm_script_logo.png
// ==/UserScript==

(async function () {
	'use strict';

	if (window.location.pathname.startsWith('/login')) { return; }
	if (document.querySelector('[src^="intel"]')) { return; }
	const vanillaScriptSrc = document.querySelector('[src^="script"]').getAttribute('src');

	window.stop();
	document.open();
	if (/firefox/i.test(window.navigator.userAgent) == false) {
		for (let i = 0; i <= 100; i += 1) { window.navigator.geolocation.clearWatch(i); }
	}


	const logsNerrors = [];
	const pushMessage = messages => {
		logsNerrors.push({ timestamp: Date.now(), messages });
	};
	const logDecorator = genuineFunction => {
		return function (...args) {
			pushMessage(args.map(arg => arg?.message ? `${arg.message}${arg.stack ? '<br>' + arg.stack : ''}` : arg.toString()));
			return genuineFunction(...args);
		};
	};
	window.cl = console.log;
	console.log = logDecorator(console.log);
	console.warn = logDecorator(console.warn);
	console.error = logDecorator(console.error);
	window.onerror = (event, source, line, column, error) => { pushMessage([error.message, `Line: ${line}, column: ${column}`]); };


	const USERSCRIPT_VERSION = '25.8.3';
	const HOME_DIR = 'https://nicko-v.github.io/sbg-cui';
	const __CUI_WEB_RES_CACHE_TIMEOUT = 24 * 60 * 60 * 1000 // 24h
	const VIEW_PADDING = (window.innerHeight / 2) * 0.7;

	const __cui_constants = '__cui_constants';
	let cached_constants = JSON.parse(localStorage.getItem(__cui_constants) ?? '{}')
	if (!cached_constants?.timestamp || (Date.now() - cached_constants?.timestamp > __CUI_WEB_RES_CACHE_TIMEOUT)) {
		cached_constants = await fetch(`${HOME_DIR}/const.json`).then(res => res.json()).catch(error => { window.alert(`Ошибка при получении ${HOME_DIR}/const.json.\n\n${error.message}`); });
		localStorage.setItem(__cui_constants, JSON.stringify({...cached_constants, timestamp: Date.now()}))
	}

	const {
		ACTIONS_REWARDS, CORES_ENERGY, CORES_LIMITS, LINES_LIMIT, DISCOVERY_COOLDOWN, HIGHLEVEL_MARKER, HIT_TOLERANCE, INVENTORY_LIMIT,
		INVIEW_MARKERS_MAX_ZOOM, INVIEW_POINTS_DATA_TTL, INVIEW_POINTS_LIMIT, ITEMS_TYPES, /*LATEST_KNOWN_VERSION,*/ LEVEL_TARGETS,
		MAX_DISPLAYED_CLUSTER, MIN_FREE_SPACE, PLAYER_RANGE, TILE_CACHE_SIZE, POSSIBLE_LINES_DISTANCE_LIMIT, BLAST_ANIMATION_DURATION
	} = cached_constants;

	const LATEST_KNOWN_VERSION = '0.5.1' // override

	const config = {}, state = {}, favorites = {};
	const isCdbMap = JSON.parse(localStorage.getItem('settings'))?.base == 'cdb';
	const isDarkMode = matchMedia('(prefers-color-scheme: dark)').matches;
	const portrait = window.matchMedia('(orientation: portrait)');
	let isFollow = localStorage.getItem('follow') == 'true';
	let map, view, playerFeature, tempLinesSource;


	window.addEventListener('dbReady', loadPageSource);
	window.addEventListener('olReady', () => { olInjection(); loadMainScript(); });
	window.addEventListener('mapReady', main);


	let database;
	const openRequest = indexedDB.open('CUI', 9);

	openRequest.addEventListener('upgradeneeded', event => {
		function initializeDB() {
			database.createObjectStore('config');
			database.createObjectStore('logs', { keyPath: 'timestamp' });
			database.createObjectStore('state');
			database.createObjectStore('stats', { keyPath: 'name' });
			database.createObjectStore('tiles');
			database.createObjectStore('favorites', { keyPath: 'guid' });

			const transaction = event.target.transaction;
			const configStore = transaction.objectStore('config');
			const logsStore = transaction.objectStore('logs');
			const stateStore = transaction.objectStore('state');

			for (let key in defaultConfig) { configStore.add(defaultConfig[key], key); }

			logsStore.createIndex('action_type', 'type');

			stateStore.add(new Set(), 'excludedCores');
			stateStore.add(true, 'isMainToolbarOpened');
			stateStore.add(false, 'isRotationLocked');
			stateStore.add(false, 'isStarMode');
			stateStore.add(null, 'lastUsedCatalyser');
			stateStore.add(null, 'starModeTarget');
			stateStore.add(0, 'versionWarns');
			stateStore.add(false, 'isAutoShowPoints');
		}

		function updateDB() {
			const updateToVersion = {
				2: () => {
					database.createObjectStore('logs', { keyPath: 'timestamp' });
				},
				3: () => {
					const logsStore = event.target.transaction.objectStore('logs');
					logsStore.clear();
					logsStore.createIndex('action_type', 'type');
				},
				4: () => {
					const { base, theme } = JSON.parse(localStorage.getItem('settings')) || {};
					const baselayer = `${base}_${theme}`;
					const stateStore = event.target.transaction.objectStore('state');

					stateStore.add(baselayer, 'baselayer');
					database.createObjectStore('tiles');
				},
				5: () => {
					const configStore = event.target.transaction.objectStore('config');
					configStore.put(defaultConfig.notifications, 'notifications');
				},
				6: () => {
					const configStore = event.target.transaction.objectStore('config');
					const request = configStore.get('maxAmountInBag');

					request.addEventListener('success', event => {
						const maxAmountInBag = event.target.result;
						['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'].forEach((romanLevel, index) => {
							const arabicLevel = index + 1;

							maxAmountInBag.catalysers[arabicLevel] = maxAmountInBag.catalysers[romanLevel];
							maxAmountInBag.cores[arabicLevel] = maxAmountInBag.cores[romanLevel];
							delete maxAmountInBag.catalysers[romanLevel];
							delete maxAmountInBag.cores[romanLevel];
						});

						configStore.put(maxAmountInBag, 'maxAmountInBag');
					});
				},
				7: () => {
					const configStore = event.target.transaction.objectStore('config');
					const request = configStore.get('drawing');

					request.addEventListener('success', event => {
						const drawing = event.target.result;

						drawing.hideLastFavRef = 0;

						configStore.put(drawing, 'drawing');
					});
				},
				8: () => {
					const stateStore = event.target.transaction.objectStore('state');
					const tilesStore = event.target.transaction.objectStore('tiles');

					stateStore.delete('baselayer');
					tilesStore.clear();
				},
				9: () => {
					const configStore = event.target.transaction.objectStore('config');
					const request = configStore.get('drawing');

					request.addEventListener('success', event => {
						const drawing = event.target.result;

						drawing.returnToPointInfo = 'discoverable';

						configStore.put(drawing, 'drawing');
					});
				},
			};

			for (let v in updateToVersion) {
				if (v > oldVersion && v <= newVersion) { updateToVersion[v](); }
			}
		}

		const defaultConfig = {
			maxAmountInBag: {
				cores: { 1: -1, 2: -1, 3: -1, 4: -1, 5: -1, 6: -1, 7: -1, 8: -1, 9: -1, 10: -1 },
				catalysers: { 1: -1, 2: -1, 3: -1, 4: -1, 5: -1, 6: -1, 7: -1, 8: -1, 9: -1, 10: -1 },
				references: { allied: -1, hostile: -1 },
			},
			autoSelect: {
				deploy: 'max',  // min || max || off
				upgrade: 'min', // min || max || off
				attack: 'latest',  // max || latest
			},
			mapFilters: {
				invert: isDarkMode && !isCdbMap ? 1 : 0,
				hueRotate: isDarkMode ? 180 : 0,
				brightness: isDarkMode ? 0.75 : 1,
				grayscale: isDarkMode ? 1 : 0,
				sepia: 1,
				blur: 0,
				branding: 'default', // default || custom
				brandingColor: '#CCCCCC',
			},
			tinting: {
				map: 1,
				point: 'level', // level || team || off
				profile: 1,
			},
			vibration: {
				buttons: 1,
				notifications: 1,
			},
			ui: {
				doubleClickZoom: 0,
				restoreRotation: 1,
				pointBgImage: 1,
				pointBtnsRtl: 0,
				pointBgImageBlur: 1,
				pointDischargeTimeout: 1,
				speedometer: 1,
			},
			pointHighlighting: {
				inner: 'uniqc', // fav || ref || uniqc || uniqv || cores || highlevel || off
				outer: 'off',
				outerTop: 'cores',
				outerBottom: 'highlevel',
				text: 'refsAmount', // energy || level || lines || refsAmount || off
				innerColor: '#E87100',
				outerColor: '#E87100',
				outerTopColor: '#EB4DBF',
				outerBottomColor: '#28C4F4',
			},
			drawing: {
				returnToPointInfo: 'discoverable',
				minDistance: -1,
				maxDistance: -1,
				hideLastFavRef: 0,
			},
			notifications: {
				status: 'all', // all || fav || off
				onClick: 'jumpto', // close || jumpto
				interval: 30000,
				duration: -1,
			},
		};

		const { newVersion, oldVersion } = event;
		database = event.target.result;

		if (oldVersion == 0) { initializeDB(); } else { updateDB(); }
	});
	openRequest.addEventListener('success', event => {
		function getData(event) {
			const storeName = event.target.source.name;
			const cursor = event.target.result;
			let objectToPopulate;

			switch (storeName) {
				case 'config':
					objectToPopulate = config;
					break;
				case 'state':
					objectToPopulate = state;
					break;
				case 'favorites':
					objectToPopulate = favorites;
					break;
				default:
					return;
			}

			if (cursor != undefined) {
				objectToPopulate[cursor.key] = cursor.value;
				cursor.continue();
			}
		}

		function checkStorageSize() {
			if (typeof navigator.storage?.estimate != 'function') { return; }

			const formatter = bytes => bytes >= 1024 ** 3 ? `${+(bytes / 1024 ** 3).toFixed(2)} GB` : `${+(bytes / 1024 ** 2).toFixed(1)} MB`;

			navigator.storage.estimate().then(({ quota, usage }) => {
				console.log(`Storage quota: ${formatter(quota)}, usage: ${formatter(usage)}.`);
			});
		}

		if (database == undefined) { database = event.target.result; }

		database.addEventListener('versionchange', () => {
			database.close();
			window.location.reload();
		});
		database.addEventListener('error', event => {
			console.log('SBG CUI: Ошибка при работе с БД.', event.target.error);
		});

		const transaction = database.transaction(['config', 'favorites', 'state', 'tiles'], 'readonly');
		transaction.addEventListener('complete', () => { window.dispatchEvent(new Event('dbReady')); });

		const configRequest = transaction.objectStore('config').openCursor();
		const favoritesRequest = transaction.objectStore('favorites').openCursor();
		const stateRequest = transaction.objectStore('state').openCursor();
		//const tilesRequest = transaction.objectStore('tiles').getAll();
		[configRequest, favoritesRequest, stateRequest].forEach(request => { request.addEventListener('success', getData); });

		checkStorageSize();
	});
	openRequest.addEventListener('error', event => {
		console.log('SBG CUI: Ошибка открытия базы данных', event.target.error);
	});


	function loadPageSource() {
		fetch('/app')
			.then(r => r.text())
			.then(data => {
				data = data.replace(/<script class="mobile-check">.+?<\/script>/, '');
				data = data.replace(/(<script src="\/packages\/js\/ol@\d+.\d+.\d+\.js")(>)/, `$1 onload="window.dispatchEvent(new Event('olReady'))"$2`);

				document.write(data);
				document.close();
			})
			.catch(error => { console.log('SBG CUI: Ошибка при получении страницы.', error); });
	}

	function olInjection() {
		class Map extends ol.Map {
			constructor(options) {
				super(options);
				map = this;
				tempLinesSource = options.layers.filter(layer => layer.get('name') == 'lines')[1]?.getSource();
				window.dispatchEvent(new Event('mapReady'));
			}

			forEachFeatureAtPixel(pixel, callback, options = {}) {
				const isShowInfoCallback = callback.toString().includes('piv.push');

				options.hitTolerance = isFinite(options.hitTolerance) ? options.hitTolerance : HIT_TOLERANCE;

				if (isShowInfoCallback) {
					const proxiedCallback = (feature, layer) => {
						if (feature.get('sbgcui_chosenFeature')) {
							callback(feature, layer);
							feature.unset('sbgcui_chosenFeature', true);
						}
					};
					super.forEachFeatureAtPixel(pixel, proxiedCallback, options);
				} else {
					super.forEachFeatureAtPixel(pixel, callback, options);
				}
			}
		}

		class Feature extends ol.Feature {
			setStyle(style) {
				if (style && playerFeature == undefined && style.length == 3 && style[0].image_?.iconImage_.src_.match(/\/assets\/player/)) {
					let setCenter = style[1].getGeometry().setCenter;

					style[1].getGeometry().setCenter = pos => {
						setCenter.call(style[1].getGeometry(), pos);
						style[3].getGeometry().setCenter(pos);
					};

					style[3] = new ol.style.Style({
						geometry: new ol.geom.Circle(ol.proj.fromLonLat([0, 0]), 0),
						stroke: new ol.style.Stroke({ color: '#CCCCCC33', width: 4 }),
					});

					playerFeature = this;
				}

				super.setStyle(style);
			}

			get blastRange() {
				return this == playerFeature ? this.getStyle()[3].getGeometry() : undefined;
			}
		}

		class PointFeature extends ol.Feature { }

		class View extends ol.View {
			constructor(options) {
				if (portrait.matches) { options.padding = [VIEW_PADDING, 0, 0, 0]; }
				super(options);
				view = this;
			}

			fitBlastRange(isCompleted) {
				const currentZoom = this.getZoom();
				const isZoomChanged = view.get('isZoomChanged');
				const maxZoom = isZoomChanged ? currentZoom : 17;

				if (isCompleted) { this.set('blastRangeZoom', currentZoom); return; }

				this.removePadding();
				this.fit(playerFeature.blastRange, {
					callback: this.fitBlastRange.bind(this),
					duration: 0, // Временно отключено
					maxZoom,
				});
			}

			fitTempLine(lineGeometry, padding) {
				this.removePadding();
				this.fit(lineGeometry, {
					duration: 0,
					maxZoom: 17,
					padding,
				});
			}

			setTopPadding() {
				if (!portrait.matches) { return; }
				this.padding = [VIEW_PADDING, 0, 0, 0];
			}

			setBottomPadding() {
				if (!portrait.matches) { return; }
				this.padding = [0, 0, VIEW_PADDING, 0];
			}

			removePadding() {
				this.padding = [0, 0, 0, 0];
			}
		}

		class Tile extends ol.layer.Tile {
			constructor(options) {
				options.preload = Infinity;
				super(options);
			}
		}

		class XYZ extends ol.source.XYZ {
			constructor(options) {
				super({ ...options, ...cachingOptions });
			}
		}

		class OSM extends ol.source.OSM {
			constructor(options) {
				super({ ...options, ...cachingOptions });
			}
		}

		class StadiaMaps extends ol.source.StadiaMaps {
			constructor(options) {
				super({ ...options, ...cachingOptions });
			}
		}


		function loadTile(tile, src) {
			const coords = tile.getTileCoord().join();
			const urlTemplate = tile.key;
			const tilesStore = database.transaction('tiles', 'readonly').objectStore('tiles');
			const request = tilesStore.get(coords);

			request.addEventListener('success', event => {
				const cachedTile = event.target.result || {};
				const cachedBlob = cachedTile[urlTemplate];

				if (cachedBlob == undefined) {
					fetch(src)
						.then(response => {
							if (response.ok) {
								return response.blob()
							} else {
								throw new Error(`[HTTP ${response.status}] Не удалось загрузить тайл ${coords}.`);
							}
						})
						.then(blob => {
							setTileSrc(tile, blob);
							database.transaction('tiles', 'readwrite').objectStore('tiles').put({ [urlTemplate]: blob, ...cachedTile }, coords);
						})
						.catch(error => { console.log('SBG CUI: Ошибка при получении тайла.', error); });
				} else {
					setTileSrc(tile, cachedBlob);
				}
			});
		}

		function setTileSrc(tile, blob) {
			const image = tile.getImage();
			const objUrl = URL.createObjectURL(blob);
			image.addEventListener('load', () => { URL.revokeObjectURL(objUrl); });
			image.src = objUrl;
		}


		const cachingOptions = {
			cacheSize: TILE_CACHE_SIZE,
			tileLoadFunction: loadTile,
		};

		ol.Map = Map;
		ol.View = View;
		ol.Feature = Feature;
		ol.PointFeature = PointFeature;
		ol.layer.Tile = Tile;
		ol.source.XYZ = XYZ;
		ol.source.OSM = OSM;
		ol.source.StadiaMaps = StadiaMaps;
	}

	function loadMainScript() {
		function replacer(match) {
			const layers = {
				OSM: `if (type == 'osm') {`, 
				// STADIA: `if (type.startsWith('stadia')) { source=new ol.source.StadiaMaps({ layer:'stamen_'+type.split('_')[1] })} else if (type == 'osm') {`
				STADIA: `if (type.startsWith('stadia')) { source=new ol.source.StadiaMaps({ layer:'stamen_'+type.split('_')[1] })} else `,
				YANDEX: `if (type == 'ymaps') { \n  theme = is_dark ? 'dark' : 'light';\n  source = new ol.source.XYZ({ url: \`https://core-renderer-tiles.maps.yandex.net/tiles?l=map&x={x}&y={y}&z={z}&scale=1&projection=web_mercator&theme=\${theme}&lang=ru\` });\n} else `,
			}
			replacesMade += 1;
			switch (match) {
				case `const Catalysers`: // Line ~95
					return `window.Catalysers`;
				case `const TeamColors`: // Line ~101
					return `window.TeamColors`;
				case `new ol.Feature({`: // Line ~161, 1891
					return 'new ol.PointFeature({';
				case `constrainResolution: true`: // Line ~261
					return `constrainResolution: false`;
				case `movePlayer([coords.longitude, coords.latitude])`: // Line ~353
					return `${match};
									window.dispatchEvent(new Event('playerMove'));
									if (!document.querySelector('.info.popup').classList.contains('hidden')) {
										manageControls();
          					$('#i-stat__distance').text(distanceToString(getDistance(point_state.info.c)));
									}`;
				case `$('body').empty()`: // Line ~363
					return 'movePlayer([0,0]); undefined?';
				case `const attack_slider`: // Line ~409
					return `window.attack_slider`;
				case `const deploy_slider`: // Line ~427
					return `window.deploy_slider`;
				case `const draw_slider`: // Line ~442
					return `window.draw_slider`;
				// case `closePopup($('.info'))`: // Line ~674
				// 	return `$('.info').addClass('hidden');`;
				case `if (new_val < 1) new_val = 1`: // Line ~795
					return `if (new_val < 1) new_val = max`;
				case `if ($('.attack-slider-wrp').hasClass('hidden')) {`: // Line ~908
					return `${match}return;`;
				case `$('[name="baselayer"]').on('change', e`: // Line ~1108
					return `$('.layers-config__list').on('change', '[name="baselayer"]', e`;
				case `hour: '2-digit'`: // Line ~1244
					return `${match}, hourCycle: 'h23', second: '2-digit'`;
				case `view.setCenter(ol.proj.fromLonLat(entry.c))`: // Line ~1257
					return `${match}; window.sbgcuiHighlightFeature(undefined, entry.c);`;
				case `function initCompass() {`: // Line ~1280
					return DeviceOrientationEvent ? `${match}return;` : match;
				case `testuser`: // Line ~1314
					return `eyemax`;
				case `timers.info_controls = setInterval(() => {`: // Line ~1443
					return `timers.info_controls = setTimeout(() => {`;
				case `function update() {`: // Line ~1521
					return `${match} if (guid !== $('.info').attr('data-guid')) { return; }`;
				case `delete cooldowns[guid]`: // Line ~1532
					return `${match}; manageControls();`;
				case `function closeDrawSlider() {`: // Line ~1558
					return `${match} window.closePopupDecorator(closePopup);`;
				case `function makeEntry`: // Line ~1678
					return `}{window.makeEntry = function`;
				case `view.calculateExtent(map.getSize()`: // Line ~1872, 1873
					return `view.calculateExtent([map.getSize()[0], map.getSize()[1] + ${VIEW_PADDING}]`;
				case `z: view.getZoom()`: // Line ~1874
					return `z: Math.floor(view.getZoom())`;
				case `function explodeRange(prop) {`: // Line ~1967
					return `${match} window.highlightFeature(player_feature, undefined, { once: true, duration: ${BLAST_ANIMATION_DURATION}, radius: prop.range, color: '#FF0000', width: 5 + prop.lv / 2 }); return;`;
				case `function explodeRange(level) {`: // Line ~1967
					return `${match} window.highlightFeature(player_feature, undefined, { once: true, duration: ${BLAST_ANIMATION_DURATION}, radius: Catalysers[level].range, color: '#FF0000', width: 5 + level / 2 }); return;`;
				case `if (area < 1)`: // Line ~1972
					return `if (area < 0)`;
				case `makeItemTitle(item)`: // Line ~2018
					return `makeShortItemTitle(item)`;
				case layers.OSM: // Line ~2166
					return [layers.STADIA, layers.YANDEX, layers.OSM].join('');
				case `class Bitfield`: // Line ~2306
					return `window.openProfile = openProfile; window.requestEntities = requestEntities; window.showInfo = showInfo; window.Bitfield = class Bitfield`;
				default:
					replacesMade -= 1;
					return match;
			}
		}

		const regexp = new RegExp([
			`(const Catalysers)`,
			`(const TeamColors)`,
			`((new ol\\.Feature\\({(?=\\s+?geometry: new ol\\.geom\\.Point\\(mpos\\))))`,
			`(constrainResolution: true)`,
			`(movePlayer\\(\\[coords\\.longitude, coords\\.latitude\\]\\))`,
			`(\\$\\('body'\\)\\.empty\\(\\))`,
			`(const attack_slider)`,
			`(const deploy_slider)`,
			`(const draw_slider)`,
			`(closePopup\\(\\$\\('\\.info'\\)\\))`,
			`(if \\(new_val < 1\\) new_val = 1)`,
			`(if \\(\\$\\('\\.attack-slider-wrp'\\)\\.hasClass\\('hidden'\\)\\) {)`,
			`(\\$\\('\\[name="baselayer"\\]'\\)\\.on\\('change', e)`,
			`(hour: '2-digit')`,
			`(view\\.setCenter\\(ol\\.proj\\.fromLonLat\\(entry\\.c\\)\\))`,
			`(function initCompass\\(\\) {)`,
			`(testuser)`,
			`(timers\\.info_controls = setInterval\\(\\(\\) => {)`,
			`(function update\\(\\) {)`,
			`(delete cooldowns\\[guid\\](?=\\s+?localStorage\\.setItem))`,
			`(function closeDrawSlider\\(\\) {)`,
			`(function makeEntry)`,
			`(view\\.calculateExtent\\(map\\.getSize\\(\\))`,
			`(z: view\\.getZoom\\(\\))`,
			`(function explodeRange\\(prop\\) {)`,
			`(function explodeRange\\(level\\) {)`,
			`(if \\(area < 1\\))`,
			`(makeItemTitle\\(item\\)(?!\\s{))`,
			`(if \\(type == 'osm'\\) {)`,
			`(class Bitfield)`,
		].join('|'), 'g');

		const replacesShouldBe = 32;
		let replacesMade = 0;

		fetch(`/app/${vanillaScriptSrc}`)
			.then(r => r.text())
			.then(data => {
				const script = document.createElement('script');
				script.textContent = data.replace(regexp, replacer);
				if (replacesMade != replacesShouldBe) { /*throw new Error*/ alert(`SBG CUI: Сделано замен: ${replacesMade} вместо ${replacesShouldBe}.`); }
				document.head.appendChild(script);
			})
			.catch(error => {
				alert(`SBG CUI: Ошибка при загрузке основного скрипта. ${error.message}`);
				console.log('SBG CUI: Ошибка при загрузке основного скрипта.', error);
			});
	}


	async function main() {
		try {
			const thousandSeparator = Intl.NumberFormat(i18next.language).formatToParts(1111)[1].value;
			const decimalSeparator = Intl.NumberFormat(i18next.language).formatToParts(1.1)[1].value;

			class DiscoverModifier {
				constructor(loot, refs) {
					this.loot = loot;
					this.refs = refs;
				}

				get isActive() {
					return !(this.loot && this.refs);
				}
			}

			class Point {
				constructor(pointData) {
					this.coords = pointData.c;
					this.guid = pointData.g;
					this.team = pointData.te;
					this.title = pointData.t;
					this.owner = pointData.o;
					this.guard = pointData.gu;
					this.possibleLines = undefined;
					this.lines = {
						in: pointData.li.i,
						out: pointData.li.o,
					};
					this.regionsAmount = pointData.r;
					this.cores = {};
					this.image = `https://lh3.googleusercontent.com/${pointData.i}`;
					this.isVisited = pointData.u.v;
					this.isCaptured = pointData.u.c;

					drawButton.removeAttribute('sbgcui-possible-lines');
					this.updateCores(pointData.co);

					if (this.owner == player.name) { this.getCaptureDate(); }
				}

				static calculateTotalEnergy(cores) {
					if (Object.keys(cores).length == 0) { return 0; }

					let maxPointEnergy = 0;
					let pointEnergy = 0;

					for (let guid in cores) {
						maxPointEnergy += CORES_ENERGY[cores[guid].level];
						pointEnergy += cores[guid].energy;
					}

					return pointEnergy / maxPointEnergy * 100;
				}

				get emptySlots() {
					return 6 - Object.keys(this.cores).length;
				}

				get hasEmptySlots() {
					return this.emptySlots > 0;
				}

				get playerCores() {
					let playerCores = {};

					for (let key in this.cores) {
						let core = this.cores[key];

						if (core.owner == player.name) {
							if (core.level in playerCores) {
								playerCores[core.level] += 1
							} else {
								playerCores[core.level] = 1;
							}
						}
					}

					return playerCores; // { level: amount }
				}

				get energy() {
					return Point.calculateTotalEnergy(this.cores);
				}

				get energyFormatted() {
					return percent_format.format(this.energy);
				}

				get coresAmount() {
					return Object.keys(this.cores).length;
				}

				get level() {
					const coresTotalLevels = Object.values(this.cores).reduce((acc, core) => acc + core.level, 0);
					const emptySlotsTotalLevels = (6 - this.coresAmount);
					return Math.trunc((coresTotalLevels + emptySlotsTotalLevels) / 6);
				}

				get linesAmount() {
					return this.lines.in + this.lines.out;
				}

				get destroyReward() {
					return (
						ACTIONS_REWARDS.destroy.core * this.coresAmount +
						ACTIONS_REWARDS.destroy.line * this.linesAmount +
						ACTIONS_REWARDS.destroy.region * this.regionsAmount
					);
				}

				get selectedCoreGuid() {
					return pointCores.querySelector('.selected')?.dataset.guid;
				}

				get isOutgoingLinesLimitReached() {
					return this.lines.out >= LINES_LIMIT.out;
				}

				get isPossibleLinesRequestNeeded() {
					return (
						this.possibleLines == undefined &&
						this.hasEmptySlots == false &&
						this.isOutgoingLinesLimitReached == false &&
						this.team == player.team &&
						getDistance(this.coords) <= POSSIBLE_LINES_DISTANCE_LIMIT
					);
				}

				async getPossibleLines() {
					const settings = JSON.parse(localStorage.getItem('settings'));
					const isExref = settings.exref ?? false;
					const searchParams = new URLSearchParams([
						['guid', this.guid],
						['position[]', this.coords[0]],
						['position[]', this.coords[1]],
						['exref', isExref],
						['sbgcuiPossibleLinesCheck', '']
					]);
					const url = '/api/draw?' + searchParams.toString();
					const options = { headers, method: 'GET' };
					const response = await fetch(url, options);
					const parsedResponse = await response.json();

					return parsedResponse.data.map(point => ({ guid: point.p, title: point.t, distance: point.d }));
				}

				getCaptureDate() {
					const logsStore = database.transaction('logs', 'readonly').objectStore('logs');
					const getAllCapturesRequest = logsStore.index('action_type').getAll('capture');

					getAllCapturesRequest.addEventListener('success', event => {
						const allCaptureRecords = event.target.result;
						const pointCaptures = allCaptureRecords.filter(record => record.point == this.guid);
						const latestCapture = pointCaptures[pointCaptures.length - 1]?.timestamp;
						const guardDays = this.guard;
						let captureDate = null;

						if (latestCapture != undefined) {
							const days = Math.trunc((Date.now() - latestCapture) / 1000 / 60 / 60 / 24);
							if (days == guardDays) { captureDate = new Date(latestCapture); }
						}

						const eventDetails = { guid: this.guid, captureDate, guardDays };
						const customEvent = new CustomEvent('pointCaptureDateFound', { detail: eventDetails });

						window.dispatchEvent(customEvent);
					});
				}

				updateCores(cores) {
					cores.forEach(core => {
						this.cores[core.g] = {
							energy: core.e,
							level: core.l,
							owner: core.o,
						}
					});

					const event = new Event('pointRepaired');
					pointPopup.dispatchEvent(event);

					if (this.team == 0 && cores.length == 1) {
						this.team = player.team;

						const eventDetails = { guid: this.guid, captureDate: new Date(), guardDays: 0 };
						const customEvent = new CustomEvent('pointCaptured', { detail: eventDetails });
						window.dispatchEvent(customEvent);
					}

					if (this.isPossibleLinesRequestNeeded) {
						this.getPossibleLines().then(possibleLines => {
							this.possibleLines = possibleLines;
							drawButton.setAttribute('sbgcui-possible-lines', this.possibleLines.length);
							window.draw_slider.options.pagination = this.possibleLines.length <= 20;
						});
					}
				}

				updateDrawings(endPointGuid, regionsCreated) {
					this.lines.out += 1;
					this.regionsAmount += regionsCreated;
					this.possibleLines = this.possibleLines.filter(line => line.guid != endPointGuid);
					drawButton.setAttribute('sbgcui-possible-lines', this.possibleLines.length);
					linesOutSpan.innerText = this.lines.out;
					regionsAmountSpan.innerText = this.regionsAmount;
					pointPopup.dispatchEvent(new Event('lineDrawn'));
				}

				selectCore(type, currentLevel) {
					let cachedCores = JSON.parse(localStorage.getItem('inventory-cache')).filter(e => e.t == 1 && !excludedCores.has(e.g)).sort((a, b) => a.l - b.l);
					let playerCores = this.playerCores;
					let core;

					switch (type) {
						case 'min':
							if (currentLevel) { // Если передан уровень ядра - ищем ядро для апгрейда не ниже этого уровня.
								core = cachedCores.find(e => (e.l > currentLevel) && ((playerCores[e.l] || 0) < CORES_LIMITS[e.l]) && (e.l <= player.level));
							} else { // Иначе ищем ядро минимального уровня.
								core = cachedCores.find(e => ((playerCores[e.l] || 0) < CORES_LIMITS[e.l]) && (e.l <= player.level));
							}
							break;
						case 'max':
							core = cachedCores.findLast(e => (e.l <= player.level) && ((playerCores[e.l] || 0) < CORES_LIMITS[e.l]));
							break;
					}

					click(coresList.querySelector(`[data-guid="${core?.g}"]:not(.is-active)`));
				}
			}

			class InviewPoint {
				constructor(pointData) { // Чистый ответ сервера или объект Point.
					this.cores = pointData.co ?? pointData.coresAmount;
					this.energy = pointData.e ?? pointData.energy;
					this.guid = pointData.g ?? pointData.guid;
					this.level = pointData.l ?? pointData.level;
					this.lines = {
						in: pointData.li?.i ?? pointData.lines.in,
						out: pointData.li?.o ?? pointData.lines.out,
					};
					this.timestamp = Date.now();
				}

				update(pointData) {
					this.cores = pointData.co ?? pointData.coresAmount ?? this.cores;
					this.energy = pointData.e ?? pointData.energy ?? this.energy;
					this.guid = pointData.g ?? pointData.guid ?? this.guid;
					this.level = pointData.l ?? pointData.level ?? this.level;
					this.lines = {
						in: pointData.li?.i ?? pointData.lines?.in ?? this.lines.in,
						out: pointData.li?.o ?? pointData.lines?.out ?? this.lines.out,
					};
					this.timestamp = Date.now();
					pointsSource.getFeatureById(this.guid)?.changed();
				}

				get linesAmount() {
					return this.lines.in + this.lines.out;
				}
			}

			class Toolbar extends ol.control.Control {
				#expandButton = document.createElement('button');
				#isExpanded = false;
				#toolbar = document.createElement('div');

				constructor(toolbarName) {
					const container = document.createElement('div');

					container.classList.add('ol-unselectable', 'ol-control', 'sbgcui_toolbar-control');
					super({ element: container });

					this.name = toolbarName;

					this.#expandButton.classList.add('fa', 'fa-solid-angle-up');
					this.#expandButton.addEventListener('click', this.handleExpand.bind(this));

					this.#toolbar.classList.add('sbgcui_toolbar');

					isMainToolbarOpened ? this.expand() : this.collapse();

					container.append(this.#toolbar, this.#expandButton);
				}

				addItem(item, order) {
					item.style.order = order;
					this.#toolbar.appendChild(item);
				}

				collapse() {
					this.#expandButton.classList.remove('fa-rotate-180');
					this.#expandButton.style.opacity = 1;

					this.#toolbar.classList.add('sbgcui_hidden');

					this.#isExpanded = false;
					database.transaction('state', 'readwrite').objectStore('state').put(false, `is${this.name}Opened`);
				}

				expand() {
					this.#expandButton.classList.add('fa-rotate-180');
					this.#expandButton.style.opacity = 0.5;

					this.#toolbar.classList.remove('sbgcui_hidden');

					this.#isExpanded = true;
					database.transaction('state', 'readwrite').objectStore('state').put(true, `is${this.name}Opened`);
				}

				handleExpand() {
					this.#isExpanded ? this.collapse() : this.expand();
				}
			}

			class Favorite {
				#cooldown;
				#cooldownNotifToast

				constructor(guid, cooldown, name) {
					this.guid = guid;
					this.name = name || guid;
					this.cooldown = cooldown;
					this.discoveriesLeft = undefined;
					this.timeoutID = undefined;
					this.isActive = 1;

					if (!name) { this.#getName(); }
				}

				#getName() {
					getPointData(this.guid)
						.then(data => {
							this.name = data.t;
						})
						.catch(error => { console.log('SBG CUI: Ошибка при получении данных точки.', error); });
				}

				#notify() {
					if (!this.isActive) { return; }


					if (!isMobile() && 'Notification' in window && Notification.permission == 'granted') {
						let notification = new Notification(message, { icon: '/icons/icon_512.png' });
					} else {
						this.showCooldownNotifToast();

						if ('vibrate' in window.navigator && config.vibration.notifications) {
							window.navigator.vibrate(0);
							window.navigator.vibrate([500, 300, 500, 300, 500]);
						}
					}
				}

				#onTimeout() {
					this.#notify();
					this.cooldown = null;
				}

				#remindAt(timestamp) {
					let delay = timestamp - Date.now();

					clearTimeout(this.timeoutID);
					this.timeoutID = setTimeout(this.#onTimeout.bind(this), delay);
				}

				hideCooldownNotifToast() {
					if (this.#cooldownNotifToast == undefined) { return; }
					this.#cooldownNotifToast.hideToast();
					this.#cooldownNotifToast = undefined;
				}

				showCooldownNotifToast() {
					this.#cooldownNotifToast = createToast(`"${this.name}": <br>точка остыла.`, 'top left', -1, 'sbgcui_toast-selection');
					this.#cooldownNotifToast.showToast();
				}

				toJSON() {
					return this.cooldown > Date.now() ? this.cooldown : null;
				}

				get hasActiveCooldown() {
					return this.cooldown - Date.now() > 0;
				}

				get cooldown() {
					return this.#cooldown;
				}

				get timer() {
					if (!this.cooldown) { return ''; }

					let diff = new Date(this.cooldown - Date.now());

					if (diff < 0) { return ''; }

					let options = { hour: 'numeric', minute: 'numeric', second: 'numeric', timeZone: 'UTC' };
					let formatter = new Intl.DateTimeFormat('ru-RU', options);

					return formatter.format(diff);
				}

				set cooldown(timestamp) {
					this.#cooldown = timestamp > Date.now() ? timestamp : null;
					if (this.#cooldown) {
						this.discoveriesLeft = undefined;
						this.#remindAt(this.#cooldown);
					}
				}
			}

			class RequestLog {
				constructor(url, options, storedData) {
					if (storedData != undefined) { Object.assign(this, storedData); return; }

					this.time = { request: Date.now(), response: undefined };
					this.request = { url, options };
					this.status = undefined;
					this.statusText = undefined;
					this.response = undefined;
					this.error = undefined;
				}

				static preCachedLogs = [];
				static storageName = 'sbgcui_network-log';

				static replacer(key, value) {
					if (key == 'authorization') { return 'hidden'; }

					// Для красоты вывода, иначе при сериализации всего объекта
					// уже сериализированное тело запроса будет заэскейплено.
					if (typeof value == 'string') {
						try {
							const parsed = JSON.parse(value);
							return parsed;
						} catch (error) {
							return value;
						}
					}

					return value;
				}

				static get fullLog() {
					let cachedLogs = JSON.parse(sessionStorage.getItem(RequestLog.storageName)) ?? [];
					cachedLogs = cachedLogs.map(log => new RequestLog(undefined, undefined, log));
					cachedLogs.push(...RequestLog.preCachedLogs);
					return cachedLogs;
				}

				save() {
					RequestLog.preCachedLogs.push(this);
					if (RequestLog.preCachedLogs.length >= 100) {
						const cachedLogs = JSON.parse(sessionStorage.getItem(RequestLog.storageName)) ?? [];

						try {
							sessionStorage.setItem(RequestLog.storageName, JSON.stringify([...cachedLogs, ...RequestLog.preCachedLogs]));
							RequestLog.preCachedLogs = [];
						} catch (error) {
							sessionStorage.removeItem(RequestLog.storageName);
						}
					}
				}

				setResponse(response) {
					this.time.response = Date.now();
					// Клонирование объекта, т.к. ответ может быть подменён.
					this.response = JSON.parse(JSON.stringify(response));
				}

				setStatus(code, text) {
					this.status = code;
					this.statusText = text;
				}

				setError(error) {
					if (this.status != undefined && this.time.response == undefined) {
						this.time.response = Date.now();
					}

					switch (typeof error) {
						case 'object':
							this.error = { name: error.name, message: error.message };
							break;
						case 'string':
							this.error = { message: error };
							break;
					}
				}

				get isApiError() {
					return this.response?.error != undefined;
				}

				get formattedRequest() {
					return JSON.stringify(this.request, RequestLog.replacer, 2);
				}

				get formattedResponse() {
					return JSON.stringify(this.response, RequestLog.replacer, 2);
				}

				get formattedError() {
					let message = '';
					if (this.error.name) { message += `[${this.error.name}] `; }
					if (this.error.message) { message += `${this.error.message}`; }
					return message;
				}

				get responseTime() {
					return this.time.response - this.time.request;
				}
			}


			window.fetch = fetchDecorator(window.fetch);
			window.Toastify = toastifyDecorator(window.Toastify);

			const html = document.documentElement;
			const attackButton = document.querySelector('#attack-menu');
			const attackSlider = document.querySelector('.attack-slider-wrp');
			const blContainer = document.querySelector('.bottom-container');
			const catalysersList = document.querySelector('#catalysers-list');
			const coresList = document.querySelector('#cores-list');
			const deploySlider = document.querySelector('.deploy-slider-wrp');
			const discoverButton = document.querySelector('#discover');
			const drawButton = document.querySelector('#draw');
			const drawSlider = document.querySelector('.draw-slider-wrp');
			const invCloseButton = document.querySelector('#inventory__close');
			const inventoryButton = document.querySelector('#ops');
			const inventoryContent = document.querySelector('.inventory__content');
			const inventoryPopup = document.querySelector('.inventory.popup');
			const invTotalSpan = document.querySelector('#self-info__inv');
			const leaderboardPopup = document.querySelector('.leaderboard.popup');
			const notifsButton = document.querySelector('#notifs-menu');
			const linesOutSpan = document.querySelector('#i-stat__line-out');
			const pointCores = document.querySelector('.i-stat__cores');
			const pointEnergyValue = document.createElement('span');
			const pointImage = document.querySelector('#i-image');
			const pointImageBox = document.querySelector('.i-image-box');
			const pointLevelSpan = document.querySelector('#i-level');
			const pointOwnerSpan = document.querySelector('#i-stat__owner');
			const pointPopup = document.querySelector('.info.popup');
			const pointPopupCloseButton = document.querySelector('.info.popup > .popup-close');
			const pointTitleSpan = document.querySelector('#i-title');
			const profileNameSpan = document.querySelector('#pr-name');
			const profilePopup = document.querySelector('.profile.popup');
			const profilePopupCloseButton = document.querySelector('.profile.popup > .popup-close');
			const refsAmount = document.querySelector('#i-ref');
			const refsList = document.querySelector('#refs-list');
			const regDateSpan = document.querySelector('.pr-stat__age > .pr-stat-val');
			const regionsAmountSpan = document.querySelector('#i-stat__region');
			const selfExpSpan = document.querySelector('#self-info__exp');
			const selfLvlSpan = document.querySelector('#self-info__explv');
			const selfNameSpan = document.querySelector('#self-info__name');
			const tlContainer = document.querySelector('.topleft-container')
			const toggleFollow = document.querySelector('#toggle-follow');
			const viewportMeta = document.querySelector('meta[name="viewport"]');
			const xpDiffSpan = document.querySelector('.xp-diff');
			const zoomContainer = document.querySelector('.ol-zoom');

			let isInventoryPopupOpened = !inventoryPopup.classList.contains('hidden');
			let isPointPopupOpened = !pointPopup.classList.contains('hidden');
			let isProfilePopupOpened = !profilePopup.classList.contains('hidden');
			let isAttackSliderOpened = !attackSlider.classList.contains('hidden');
			let isDrawSliderOpened = !drawSlider.classList.contains('hidden');
			let isleaderboardPopupOpened = !leaderboardPopup.classList.contains('hidden');
			let isSettingsMenuOpened = false;
			let isRefsViewerOpened = false;
			let isLogsViewerOpened = false;
			let isFavsListOpened = false;
			let isClusterOverlayOpened = false;
			let isInvClearInProgress = false;

			let lastOpenedPoint = {};
			//let discoverModifier;
			let discoverModifier = new DiscoverModifier(1, 1);
			let latestNotifTime;
			let { excludedCores, isMainToolbarOpened, isRotationLocked, isStarMode, lastUsedCatalyser, starModeTarget, versionWarns } = state;
			const uniques = { c: new Set(), v: new Set() };
			const inview = {};
			const pointsSource = map.getLayers().getArray().find(layer => layer.get('name') == 'points').getSource();

			const percent_format = new Intl.NumberFormat(i18next.language, { maximumFractionDigits: 1 });

			const headers = { authorization: `Bearer ${localStorage.getItem('auth')}`, 'accept-language': i18next.language };
			let gameVersion;


			isStarMode = isStarMode && starModeTarget != null;

			window.closePopupDecorator = closePopupDecorator;
			window.sbgcuiHighlightFeature = highlightFeature;


			async function getSelfData() {
				const url = '/api/self';
				const options = { headers, method: 'GET' };
				const response = await fetch(url, options);
				const parsedResponse = await response.json();
				const version = response.headers.get('SBG-Version');

				gameVersion = version;

				return parsedResponse;
			}

			async function getPlayerData(guid, name) {
				const url = `/api/profile?${guid ? ('guid=' + guid) : ('name=' + name)}`;
				const options = { headers, method: 'GET' };
				const response = await fetch(url, options);
				const parsedResponse = await response.json();
                const stats = parsedResponse.stats;
                stats.xp = parsedResponse.xp;
                stats.level = parsedResponse.level;
                stats.name = parsedResponse.name;
				return stats;
			}

			async function getPointData(guid, isCompact = true, signal) {
				const url = `/api/point?guid=${guid}${isCompact ? '&status=1' : ''}`;
				const options = { headers, method: 'GET', signal };
				const response = await fetch(url, options);
				const parsedResponse = await response.json();

				return parsedResponse.data;
			}

			async function getMultiplePointsData(guids, signal, progressBarElement) {
				function handleProgress(result) {
					donePromises += 1;
					const progress = Math.floor(donePromises / totalPromises * 100);
					progressBarElement?.style.setProperty('--sbgcui-progress', `${progress}%`);
					return result;
				}

				const data = [];
				const totalPromises = guids.length;
				let donePromises = 0;

				while (guids.length > 0) {
					const promises = guids.map(guid => getPointData(guid, true, signal));
					const promiseTick = promises.map(promise => promise.then(handleProgress));
					const results = await Promise.allSettled(promiseTick);
					const rejectedGuids = [];

					results.forEach((result, index) => {
						result.status == 'fulfilled' ? data.push(result.value) : rejectedGuids.push(guids[index]);
					});

					if (guids.length == rejectedGuids.length) { // На случай потери сети или серверных ошибок.
						data.length = 0;
						break;
					} else {
						guids = rejectedGuids;
					}
				}

				return data;
			}

			async function getInventory() {
				const url = '/api/inventory';
				const options = { headers, method: 'GET' };
				const response = await fetch(url, options);
				const parsedResponse = await response.json();

				return parsedResponse.i;
			}

			async function repairPoint(guid) {
				const url = '/api/repair';
				const position = ol.proj.toLonLat(playerFeature.getGeometry().getCoordinates());
				const options = {
					headers: { ...headers, 'content-type': 'application/json' },
					method: 'POST',
					body: JSON.stringify({ guid, position }),
				};
				const response = await fetch(url, options);
				const parsedResponse = await response.json();

				return parsedResponse;
			}

			async function deleteItems(items, type) { // items: { guid: amount, }
				const url = '/api/inventory';
				const options = {
					headers: { ...headers, 'content-type': 'application/json' },
					method: 'DELETE',
					body: JSON.stringify({ selection: items, tab: type })
				};
				const response = await fetch(url, options);
				const parsedResponse = await response.json();

				return parsedResponse;
			}

			async function getHTMLasset(filename) {

				const cached_filename = `__CUI_WEB_RES_CACHE_${filename}`
				let text
				let cached = JSON.parse(localStorage.getItem(cached_filename) ?? '{}')
				if (!cached?.timestamp || !cached?.timestamp || (Date.now() - cached_constants?.timestamp > __CUI_WEB_RES_CACHE_TIMEOUT))
				{
					const url = `${HOME_DIR}/assets/html/${filename}.html`;
					const response = await fetch(url);
					if (response.status != 200) { throw new Error(`Ошибка при загрузке ресурса "${filename}.html" (${response.status})`); }
					text = await response.text();
					localStorage.setItem(cached_filename, JSON.stringify({ text, timestamp: Date.now() }))
				}
				else {
					text = cached.text
				}

				const parser = new DOMParser();
				const node = parser.parseFromString(text, 'text/html').body.firstChild;


				return node;
			}

			async function clearInventory(isForceClear = false, loot = []) {
				if (isInvClearInProgress) { return []; } else { isInvClearInProgress = true; }

				const maxAmountInBag = config.maxAmountInBag;
				const toDelete = {};

				try {
					const inventory = await getInventory();
					const itemsAmount = inventory.reduce((total, item) => total + item.a, 0);
					const isEnoughSpace = INVENTORY_LIMIT - itemsAmount >= MIN_FREE_SPACE;
					const isFilteredLoot = loot.some(item => item.isFiltered);
					const { allied, hostile } = maxAmountInBag.references;
					const deletedAmounts = {};
					let pointsTeams = {}, invTotal = Infinity, message = '';

					if (isEnoughSpace && !isForceClear && !isFilteredLoot) { return []; }

					if (!isEnoughSpace || isForceClear) {
						const isDeleteAll = allied == 0 && hostile == 0;
						const isDeleteNone = allied == -1 && hostile == -1;
						const isDeleteSome = isDeleteAll == false && isDeleteNone == false;

						if (isForceClear && isDeleteSome) { // Сноски удаляются только принудительно.
							const refs = inventory.filter(e => e.t == 3);
							const guids = refs.map(ref => ref.l);
							const pointsData = await getMultiplePointsData(guids, undefined, forceClearButton);

							pointsTeams = Object.fromEntries(pointsData.map(point => [point.g, point.te]));
						}

						inventory.forEach(item => {
							const { t: type, l: level, l: pointGuid, a: amount, g: guid } = item;
							if (type > ITEMS_TYPES.length - 1) { return; };

							const itemName = ITEMS_TYPES[type];
							let itemMaxAmount = -1;
							let amountToDelete = 0;

							if (itemName == 'references') {
								if (isStarMode && (pointGuid == starModeTarget?.guid)) {
									itemMaxAmount = -1;
								} else if (favorites[pointGuid]?.isActive) {
									itemMaxAmount = -1;
								} else if (isDeleteNone) {
									itemMaxAmount = -1;
								} else if (isDeleteAll) {
									itemMaxAmount = 0;
								} else if (Object.keys(pointsTeams).length) {
									const pointTeam = pointsTeams[pointGuid];
									const pointSide = pointTeam == player.team ? 'allied' : 'hostile';
									itemMaxAmount = pointTeam === undefined ? -1 : maxAmountInBag[itemName][pointSide];
								}
							} else {
								itemMaxAmount = maxAmountInBag[itemName]?.[level] ?? -1;
							}

							if (itemMaxAmount != -1 && amount > itemMaxAmount) {
								amountToDelete = amount - itemMaxAmount;
							}

							if (amountToDelete > 0) {
								toDelete[type] = toDelete[type] ?? {};
								toDelete[type][guid] = { amount: amountToDelete };
							}
						});
					}

					loot.forEach(item => {
						const { amount, isFiltered, guid, type } = item;

						if (isFiltered) {
							const inventoryAmount = inventory.find(item => item.g == guid)?.a;

							toDelete[type] = toDelete[type] ?? {};
							toDelete[type][guid] = toDelete[type][guid] ?? { amount: 0 };

							toDelete[type][guid].amount = Math.min(toDelete[type][guid].amount + amount, inventoryAmount ?? Infinity);
							toDelete[type][guid].uncached = amount;
							toDelete[type][guid].filtered = amount;
						} else if (toDelete[type]?.[guid] != undefined) {
							toDelete[type][guid].uncached = amount;
						}
					});

					if (Object.keys(toDelete).length == 0) { return []; }

					for (let type in toDelete) {
						const entries = Object.entries(toDelete[type]);
						const items = Object.fromEntries(entries.map(item => [item[0], item[1].amount]));
						const response = await deleteItems(items, type);

						if (!('count' in response)) {
							delete toDelete[type];
							continue;
						}
						if (response.count.total < invTotal) { invTotal = response.count.total; }

						deletedAmounts[type] = deletedAmounts[type] ?? 0;
						deletedAmounts[type] += entries.reduce((total, entry) => {
							const amount = (entry[1].amount - (entry[1].filtered ?? 0));
							return total + amount;
						}, 0);
					}

					for (let type in deletedAmounts) {
						const amount = deletedAmounts[type];
						if (amount > 0) {
							const itemName = i18next.t(`items.types.${ITEMS_TYPES[type].slice(0, -1)}`);
							message += `<br><span style="background: var(--sbgcui-branding-color); margin-right: 5px;" class="item-icon type-${type}"></span>x${deletedAmounts[type]} ${itemName}`;
						}
					}

					if (message.length) { showToast(`Удалено: ${message}`); }

					if (isFinite(invTotal)) {
						invTotalSpan.innerText = invTotal;
						if (inventoryButton.style.color.match('accent') && invTotal < INVENTORY_LIMIT) {
							inventoryButton.style.color = '';
						}
					}

					// Надо удалить предметы из кэша, т.к. при следующем хаке общее количество
					// предметов возьмётся из кэша, и счётчик будет некорректным.
					deleteFromCacheAndSliders(toDelete);
				} catch (error) {
					showToast(`Ошибка при проверке или очистке инвентаря. <br>${error.message}`, undefined, undefined, 'error-toast');
					console.log('SBG CUI: Ошибка при удалении предметов.', error);
				} finally {
					isInvClearInProgress = false;
					forceClearButton.style.removeProperty('--sbgcui-progress');
					return toDelete;
				}
			}

			function createResponse(obj, originalResponse) {
				const body = JSON.stringify(obj);
				const options = {
					status: originalResponse.status,
					statusText: originalResponse.statusText,
					headers: originalResponse.headers,
				};
				const response = new Response(body, options);

				Object.defineProperty(response, 'url', { value: originalResponse.url, enumerable: true, });

				return response;
			}

			function isMobile() {
				if ('maxTouchPoints' in window.navigator) {
					return window.navigator.maxTouchPoints > 0;
				} else if ('msMaxTouchPoints' in window.navigator) {
					return window.navigator.msMaxTouchPoints > 0;
				} else if ('orientation' in window) {
					return true;
				} else {
					return (/\b(BlackBerry|webOS|iPhone|IEMobile|Android|Windows Phone|iPad|iPod)\b/i).test(window.navigator.userAgent);
				}
			}

			function deleteFromCacheAndSliders(items) {
				let cache = JSON.parse(localStorage.getItem('inventory-cache')) || [];

				for (let type in items) {
					for (let guid in items[type]) {
						const item = items[type][guid];
						const cachedItem = cache.find(f => f.g == guid);
						const deletedAmount = item.amount - (item.uncached ?? 0);
						const slider = type == 1 ? deploySlider : type == 2 ? attackSlider : undefined;

						if (cachedItem) { cachedItem.a -= deletedAmount; }

						if (slider != undefined && deletedAmount > 0) {
							const slide = slider.querySelector(`li[data-guid="${guid}"]`);
							if (slide == null) { continue; }

							const amountSpan = slide.querySelector(`li[data-guid="${guid}"] > .${type == 1 ? 'cores' : 'catalysers'}-list__amount`);
							const amountSpanText = +amountSpan.innerText.slice(1);

							if (amountSpanText - deletedAmount > 0) {
								amountSpan.innerText = `x${amountSpanText - deletedAmount}`;
							} else {
								slide.remove();
								window[`${slider == attackSlider ? 'attack' : 'deploy'}_slider`].refresh();
							}
						}
					}
				}

				cache = cache.filter(item => item.a > 0);
				localStorage.setItem('inventory-cache', JSON.stringify(cache));
			}

			function chooseCatalyser(type) {
				let cachedCatalysers = JSON.parse(localStorage.getItem('inventory-cache')).filter(e => e.t == 2 && e.l <= player.level).sort((a, b) => a.l - b.l);
				let catalyser;

				switch (type) {
					case 'latest':
						catalyser = attackSlider.querySelector(`[data-guid="${lastUsedCatalyser}"]`);
						if (catalyser) { break; } // Если последний использованный кат не найден - проваливаемся ниже и выбираем максимальный.
					case 'max':
						catalyser = attackSlider.querySelector(`[data-guid="${cachedCatalysers[cachedCatalysers.length - 1].g}"]`);
						break;
				}

				return catalyser;
			}

			function click(element) {
				let mouseDownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
				let mouseUpEvent = new MouseEvent('mouseup', { bubbles: true, cancelable: true });
				let clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });

				element?.dispatchEvent(mouseDownEvent);
				element?.dispatchEvent(mouseUpEvent);
				element?.dispatchEvent(clickEvent);
			}

			function createToast(content = '', position = 'top left', duration = 3000, className = 'interaction-toast', oldestFirst = true) {
				let parts = position.split(/\s+/);
				let toast = Toastify({
					node: content instanceof Element ? content : undefined,
					text: content instanceof Element ? undefined : content,
					duration,
					gravity: parts[0],
					position: parts[1],
					escapeMarkup: false,
					className,
					oldestFirst,
				});
				toast.options.id = Math.round(Math.random() * 1e5);;
				toast.options.onClick = () => toast.hideToast();
				return toast;
			}

			function showToast(...options) {
				createToast(...options).showToast();
			}

			function updateExpBar(playerExp) {
				let formatter = new Intl.NumberFormat('en-GB');
				let totalLvlExp = 0;

				for (let i = 0; i < LEVEL_TARGETS.length; i += 1) {
					totalLvlExp += LEVEL_TARGETS[i];

					if (totalLvlExp > playerExp) {
						selfExpSpan.innerText = totalLvlExp != Infinity ?
							`${formatter.format(playerExp - (totalLvlExp - LEVEL_TARGETS[i]))} / ${formatter.format(LEVEL_TARGETS[i])}` :
							formatter.format(playerExp);

						selfLvlSpan.innerText = i + 1;

						return;
					}
				}
			}

			function addTinting(type) {
				function rgb2hex(rgb) {
					if (!rgb) { return ''; }
					return `#${rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/).slice(1).map(n => parseInt(n, 10).toString(16).padStart(2, '0')).join('')}`;
				}

				let color;
				let yaRegexp = /ya-title=.*?,\sya-dock=.*?(?=,|$)/;

				switch (type) {
					case 'map':
						color = getComputedStyle(selfNameSpan).color;
						break;
					case 'profile':
						color = getComputedStyle(profileNameSpan).color;
						profilePopup.style.borderColor = color;
						break;
					case 'point_level':
						color = getComputedStyle(pointLevelSpan).color;
						pointPopup.style.background = config.ui.pointBgImage ? `radial-gradient(circle, rgba(0,0,0,0.3) 65%, ${color} 100%)` : '';
						pointPopup.style.borderColor = color;
						pointTitleSpan.style.color = color;
						break;
					case 'point_team':
						color = getComputedStyle(pointOwnerSpan).color;
						pointPopup.style.background = config.ui.pointBgImage ? `radial-gradient(circle, rgba(0,0,0,0.3) 65%, ${color} 100%)` : '';
						pointPopup.style.borderColor = color;
						pointTitleSpan.style.color = color;
						break;
					default:
						color = '';
						break;
				}

				color = rgb2hex(color);

				theme.content = color;
				if (!viewportMeta.content.match(yaRegexp)) {
					viewportMeta.content += `, ya-title=${color}, ya-dock=${color}`;
				} else {
					viewportMeta.content = viewportMeta.content.replace(yaRegexp, `ya-title=${color}, ya-dock=${color}`);
				}
			}

			function showXp(amount) {
				if (amount == 0) { return; }

				let xpSpan = document.createElement('span');
				xpSpan.classList.add('sbgcui_xpdiff');

				xpSpan.innerText = `+${amount}xp`;
				xpContainer.appendChild(xpSpan);

				setTimeout(_ => { xpSpan.classList.add('sbgcui_xpdiff-out'); }, 100);
				setTimeout(_ => { xpContainer.removeChild(xpSpan); }, 3000);
			}

			function hex623(hex, isShort = true) {
				return isShort ?
					`#${[...hex].filter((e, i) => i % 2).join('')}` :
					`#${[...hex].map((e, i, a) => i % 2 ? e : a[i - 1]).join('')}`;
			}

			function hex326(hex) {
				return [...hex].map(e => e == '#' ? e : e + e).join('');
			}

			function toOLMeters(meters, rate) {
				rate = rate || 1 / ol.proj.getPointResolution('EPSG:3857', 1, view.getCenter(), 'm');
				return meters * rate;
			}

			function getDistance(to, from = playerFeature.getGeometry().getCoordinates()) {
				const line = new ol.geom.LineString([from, ol.proj.fromLonLat(to)]);
				return ol.sphere.getLength(line);
			}

			function isPointInRange(feature, lonLat) {
				const pointCoords = lonLat ?? ol.proj.toLonLat(feature.getGeometry().getCoordinates());
				return getDistance(pointCoords) < PLAYER_RANGE;
			}

			function calcPlayingTime(regDateString) {
				const regDate = Date.parse(regDateString);
				const dateNow = Date.now();
				const days = Math.trunc((dateNow - regDate) / 1000 / 60 / 60 / 24);

				return days;
			}

			function hideControls() {
				// Отключаются все кнопки и панели кроме зума и фоллоу.
				tlContainer.classList.add('sbgcui_hidden');
				blContainer.classList.add('sbgcui_hidden');
				zoomContainer.childNodes.forEach(e => { !e.matches('.ol-zoom-in, .ol-zoom-out, #toggle-follow') && e.classList.add('sbgcui_hidden'); });
				zoomContainer.style.bottom = '50%';
				map.removeControl(toolbar);
			}

			function showControls() {
				tlContainer.classList.remove('sbgcui_hidden');
				blContainer.classList.remove('sbgcui_hidden');
				zoomContainer.childNodes.forEach(e => { e.classList.remove('sbgcui_hidden'); });
				zoomContainer.style.bottom = '';
				map.addControl(toolbar);
			}

			function logAction(action) {
				const timestamp = Date.now();

				database.transaction('logs', 'readwrite').objectStore('logs').put({ timestamp, ...action });
			}

			function jumpTo(coords) {
				const olCoords = ol.proj.fromLonLat(coords);

				if (isFollow) { click(toggleFollow); }

				document.querySelectorAll('.popup').forEach(popup => { popup.classList.add('hidden'); });

				view.adjustCenter([0, VIEW_PADDING / -2]);
				view.setCenter(olCoords);
				view.setZoom(17);
			}

			function highlightFeature(feature, coords = [], options) {
				function animate(event) {
					const frameState = event.frameState;
					const elapsed = frameState.time - start;

					if (elapsed < options.duration) {
						const vectorContext = ol.render.getVectorContext(event);
						const elapsedRatio = elapsed / options.duration;

						const radius = ol.easing.easeOut(elapsedRatio) * (toOLMeters(options.radius) / resolution);
						const opacity = ol.easing.easeOut(1 - elapsedRatio);

						stroke.setWidth(options.width * (1 - elapsedRatio));
						circle.setRadius(radius);
						circle.setOpacity(opacity);
						circle.setStroke(stroke);
						highlighterFeature.changed();

						vectorContext.drawGeometry(geometry);
					} else if (options.once == true) {
						stopAnimation();
						return;
					} else {
						start = Date.now();
					}

					map.render();
				}

				function stopAnimation() {
					ol.Observable.unByKey(listenerKey);
					customPointsSource.removeFeature(highlighterFeature);
				}

				options = {
					once: false,
					radius: 20,
					duration: 1500,
					color: '#CCBB00',
					width: 5,
					...options
				};

				let start = Date.now();
				const olCoords = feature != undefined ? feature.getGeometry().getCoordinates() : ol.proj.fromLonLat(coords);
				const resolution = view.getResolution();
				const geometry = new ol.geom.Point(olCoords);
				const highlighterFeature = new ol.Feature({ geometry });
				const stroke = new ol.style.Stroke({ color: options.color, width: options.width });
				const circle = new ol.style.Circle({ opacity: 1, radius: 0, stroke });
				const highlighterStyle = new ol.style.Style({ image: circle });
				const listenerKey = customPointsLayer.on('postrender', animate);

				highlighterFeature.set('type', 'highlighter');
				highlighterFeature.setStyle(highlighterStyle);
				customPointsSource.addFeature(highlighterFeature);

				map.once('click', stopAnimation);
			}

			function fetchDecorator(fetch) {
				return async function (pathNquery, options) {
					return new Promise((resolve, reject) => {
						const url = new URL(window.location.origin + pathNquery);
						let isBroom;

						switch (url.pathname) {
							case '/api/attack2':
								const guid = JSON.parse(options.body).guid;
								const invCache = JSON.parse(localStorage.getItem('inventory-cache'));
								const message = `Использовать "${i18next.t('items.brooms_one')}"?`;

								isBroom = invCache.find(e => e.t == 4 && e.g == guid) !== undefined;

								if (isBroom && !confirm(message)) {
									resolve();
									attackSlider.dispatchEvent(new Event('attackSliderOpened'));
									return;
								}

								break;
							case '/api/inview':
								if (isRefsViewerOpened) { resolve(); return; }

								let uniqsHighlighting = Object.values(config.pointHighlighting).find(e => e.match(/uniqc|uniqv/));

								if (uniqsHighlighting) {
									const hParam = uniqsHighlighting == 'uniqc' ? 4 : 2;
									url.searchParams.set('h', hParam);
								}

								const mapConfig = JSON.parse(localStorage.getItem('map-config'));
								const layers = Bitfield.from(mapConfig.l);

								layers.change(1, 1);
								layers.change(2, 1);
								url.searchParams.set('l', layers.toString());

								break;
						}

						const log = new RequestLog(url.pathname + url.search, options);

						fetch(url.pathname + url.search, options)
							.then(async response => {
								log.setStatus(response.status, response.statusText);

								if (!url.pathname.match(/^\/api\//)) {
									resolve(response);
									// Ответы сохраняются только от API, содержимое прочих не важно,
									// но сам факт запроса и ответа должен быть в логе.
									log.setResponse('--- data not stored ---');
									log.save();
									return;
								}

								const clonedResponse = response.clone();

								clonedResponse.json().then(async parsedResponse => {
									log.setResponse(parsedResponse);
									log.save();

									switch (url.pathname) {
										case '/api/point':
											if ('data' in parsedResponse && url.searchParams.get('status') == null) { // Если есть параметр status=1, то инфа о точке запрашивается в сокращённом виде для рефа.
												const pointData = parsedResponse.data;
												const guid = pointData.g;

												lastOpenedPoint = new Point(pointData);

												if (inview[guid] == undefined) {
													if (lastOpenedPoint.coresAmount > 0) { inview[guid] = new InviewPoint(lastOpenedPoint); }
												} else {
													inview[guid].update(lastOpenedPoint);
												}
											}
											break;
										case '/api/deploy':
											if ('data' in parsedResponse) { // Есди деплой, то массив объектов с ядрами.
												const cores = parsedResponse.data.co;

												lastOpenedPoint.updateCores(cores);
												lastOpenedPoint.selectCore(config.autoSelect.deploy);

												const { coords, guid, level, title, isCaptured } = lastOpenedPoint;
												const isFirstCore = cores.length == 1;
												const actionType = isFirstCore ? (isCaptured ? 'capture' : 'uniqcap') : 'deploy';

												logAction({ type: actionType, coords, level, point: guid, title });

												if (inview[guid] == undefined) {
													inview[guid] = new InviewPoint(lastOpenedPoint);
												} else {
													inview[guid].update(lastOpenedPoint);
												}
											} else if ('c' in parsedResponse) { // Если апгрейд, то один объект с ядром.
												lastOpenedPoint.updateCores([parsedResponse.c], parsedResponse.l);
												lastOpenedPoint.selectCore(config.autoSelect.upgrade, parsedResponse.c.l);

												const { coords, level, guid: point, title } = lastOpenedPoint;

												logAction({ type: 'upgrade', coords, level, point, title });
											}
											break;
										case '/api/attack2':
											lastUsedCatalyser = JSON.parse(options.body).guid;
											database.transaction('state', 'readwrite').objectStore('state').put(lastUsedCatalyser, 'lastUsedCatalyser');

											if ('c' in parsedResponse) {
												const destroyedPoints = parsedResponse.c.filter(point => point.energy == 0).map(point => point.guid);

												if (destroyedPoints.length > 0) {
													const lines = parsedResponse.l.length;
													const regions = parsedResponse.r.length;
													const xp = parsedResponse.xp.diff;
													// API периодически меняется - то появляются данные о дате создания линии/региона, то исчезают. Пусть пишется на случай, если снова вернут.
													const now = Date.now();
													const linesCreationDates = parsedResponse.l.map(line => now - new Date(line.created_at));
													const regionsCreationDates = parsedResponse.r.map(region => now - new Date(region.created_at));
													const oldestLineDays = linesCreationDates.some(date => isFinite(date)) ? Math.trunc(Math.max(...linesCreationDates, 0) / 1000 / 60 / 60 / 24) : undefined;
													const oldestRegionDays = regionsCreationDates.some(date => isFinite(date)) ? Math.trunc(Math.max(...regionsCreationDates, 0) / 1000 / 60 / 60 / 24) : undefined;

													logAction({ type: isBroom ? 'broom' : 'destroy', points: destroyedPoints, lines, regions, oldestLineDays, oldestRegionDays, xp });
													destroyedPoints.forEach(point => {
														const guid = point.guid;
														delete inview[guid];
													});
												}

												parsedResponse.c.forEach(point => {
													if (point.guid in inview) { inview[point.guid].energy = point.energy * 100; }
												});

											}

											break;
										case '/api/discover':
											const guid = JSON.parse(options.body).guid;
											//const guid = lastOpenedPoint.guid;

											// Закрываем тост о том, что избранная точка остыла.
											if (guid in favorites) { favorites[guid].hideCooldownNotifToast(); }

											if ('loot' in parsedResponse) {
												let loot = parsedResponse.loot;

												logAction({
													type: 'discover',
													point: guid,
													title: lastOpenedPoint.title,
													level: lastOpenedPoint.level,
													loot: loot.map(e => ({ t: e.t, l: e.t == 3 ? undefined : e.l, a: e.a })),
												});
												// Сортируем лут чтобы предметы большего уровня выводились в уведомлении выше.
												parsedResponse.loot.sort((a, b) => (a.t == b.t) ? ((a.t < 3 && b.t < 3) ? (b.l - a.l) : (a.t < 3 ? a.t : b.t)) : (a.t - b.t));

												loot = loot.map(i => {
													const item = { guid: i.g, type: i.t, amount: i.a };

													if (
														(discoverModifier.refs == false && (i.t == 3)) ||
														(discoverModifier.loot == false && (i.t == 1 || i.t == 2))
													) {
														item.isFiltered = true;
													}

													return item;
												});

												if (loot.some(item => item.isFiltered)) {
													parsedResponse.loot = parsedResponse.loot.filter(e => !discoverModifier.refs ? (e.t != 3) : (e.t == 3 || e.t == 4));
												}

												const deletedItems = await clearInventory(false, loot);

												// Чистим лут от удалённых предметов, иначе основной скрипт добавит их в кэш и слайдеры.
												parsedResponse.loot.forEach(item => { item.a -= deletedItems[item.t]?.[item.g]?.amount ?? 0; });
												parsedResponse.loot = parsedResponse.loot.filter(item => item.a > 0);

												// Чтобы помигать счётчиком на карточке точки.
												if (parsedResponse.loot.find(item => item.t == 3)) { window.dispatchEvent(new Event('refAquired')); }


												const modifiedResponse = createResponse(parsedResponse, response);
												resolve(modifiedResponse);
											}

											if ('burnout' in parsedResponse || 'cooldown' in parsedResponse) {
												let dateNow = Date.now();
												let discoveriesLeft;

												// Пока точка не выжжена, в burnout приходит оставшее количество хаков.
												// После выжигания в burnout приходит таймстамп остывания точки.
												// 20 хаков – с запасом на случай ивентов.
												if (parsedResponse.burnout <= 20) {
													discoveriesLeft = parsedResponse.burnout;
												} else if (parsedResponse.cooldown <= DISCOVERY_COOLDOWN || parsedResponse.burnout < dateNow) {
													break;
												}

												if (guid in favorites) {
													if (discoveriesLeft) { favorites[guid].discoveriesLeft = discoveriesLeft; break; }
													if (favorites[guid].hasActiveCooldown) { break; }

													let cooldown = parsedResponse.burnout || (dateNow + parsedResponse.cooldown * 1000);

													favorites[guid].cooldown = cooldown;
													favorites.save();
												}
											}

											break;
										case '/api/inview':
											const inviewPoints = parsedResponse.p;
											const zoom = +url.searchParams.get('z');

											const mapConfig = JSON.parse(localStorage.getItem('map-config'));
											const lParam = url.searchParams.get('l');

											if (mapConfig.l == lParam) {
												resolve(response);
											} else {
												const layers = Bitfield.from(mapConfig.l);
												if (layers.get(1) == 0) { parsedResponse.l = []; }
												if (layers.get(2) == 0) { parsedResponse.r = []; }

												const modifiedResponse = createResponse(parsedResponse, response);
												resolve(modifiedResponse);
											}

											const hParam = url.searchParams.get('h');
											const isUniqueInRequest = hParam != null;
											const isHighlightCoresEnergyOrLevel = Object.values(config.pointHighlighting).find(e => e.match(/cores|energy|highlevel|level/)) != undefined;

											if (!inviewPoints) { break; }

											if (isHighlightCoresEnergyOrLevel && zoom >= INVIEW_MARKERS_MAX_ZOOM) {
												let capturedPoints = inviewPoints.filter(e => { !e.t && delete inview[e.g]; return e.t != 0; }); // Временная заплатка что бы на снесённых точках исчезали маркеры.

												if (capturedPoints.length <= INVIEW_POINTS_LIMIT) {
													let guids = capturedPoints.map(e => e.g) || [];

													guids.forEach(guid => {
														if (Date.now() - inview[guid]?.timestamp < INVIEW_POINTS_DATA_TTL) { return; }

														getPointData(guid)
															.then(data => {
																inview[guid] = new InviewPoint(data);
															})
															.catch(() => { inview[guid] = { timestamp: Date.now() }; });
													});
												}
											}

											if (isUniqueInRequest) {
												inviewPoints?.forEach(point => {
													const type = hParam == 4 ? 'c' : 'v';
													if (point.h) {
														uniques[type].add(point.g);
													} else {
														uniques[type].delete(point.g);
													}
												});
											}

											break;
										case '/api/draw':
											if ('line' in parsedResponse) {
												const { from, to } = JSON.parse(options.body);
												const regions = parsedResponse.reg.map(region => region.a);
												const fromTitle = from == lastOpenedPoint.guid ? lastOpenedPoint.title : undefined;
												const toTitle = lastOpenedPoint.possibleLines.find(line => line.guid == to)?.title;
												const distance = lastOpenedPoint.possibleLines.find(line => line.guid == to)?.distance;

												logAction({ type: 'draw', from, to, fromTitle, toTitle, distance, regions });

												lastOpenedPoint.updateDrawings(to, regions.length);
												inview[from]?.update({ lines: { out: inview[from].lines.out + 1 } });
											} else if ('data' in parsedResponse) {
												const isPossibleLinesCheck = url.searchParams.get('sbgcuiPossibleLinesCheck') != null;

												let { minDistance, maxDistance, hideLastFavRef } = config.drawing;
												minDistance = minDistance == -1 ? -Infinity : +minDistance;
												maxDistance = maxDistance == -1 ? Infinity : +maxDistance;

												if (isStarMode && starModeTarget && starModeTarget.guid != pointPopup.dataset.guid && /get/i.test(options.method)) {
													const targetPoint = parsedResponse.data.find(point => point.p == starModeTarget.guid);
													const hiddenPoints = parsedResponse.data.length - (targetPoint ? 1 : 0);

													parsedResponse.data = targetPoint ? [targetPoint] : [];

													if (hiddenPoints > 0 && isPossibleLinesCheck == false) {
														const message = `Точк${hiddenPoints == 1 ? 'а' : 'и'} (${hiddenPoints}) скрыт${hiddenPoints == 1 ? 'а' : 'ы'}
																			из списка, так как вы находитесь в режиме рисования "Звезда".`;
														const toast = createToast(message, 'top left', undefined, 'sbgcui_toast-selection');
														toast.showToast();
													}
												}

												if (isFinite(minDistance) || isFinite(maxDistance)) {
													const suitablePoints = parsedResponse.data.filter(point => point.d <= maxDistance && point.d >= minDistance);
													const hiddenPoints = parsedResponse.data.length - suitablePoints.length;

													parsedResponse.data = suitablePoints;

													if (hiddenPoints > 0 && isPossibleLinesCheck == false) {
														const message = `Точк${hiddenPoints == 1 ? 'а' : 'и'} (${hiddenPoints}) скрыт${hiddenPoints == 1 ? 'а' : 'ы'}
																			из списка согласно настройкам ограничения дальности рисования
																			(${isFinite(minDistance) ? 'мин. ' + minDistance + ' м' : ''}${isFinite(minDistance + maxDistance) ? ', ' : ''}${isFinite(maxDistance) ? 'макс. ' + maxDistance + ' м' : ''}).`;
														const toast = createToast(message, 'top left', undefined, 'sbgcui_toast-selection');
														toast.showToast();
													}
												}

												if (hideLastFavRef) {
													let hiddenPoints = 0;

													parsedResponse.data = parsedResponse.data.filter(point => {
														const isLastFavRef = point.p in favorites && favorites[point.p].isActive && point.a == 1;
														if (isLastFavRef) {
															hiddenPoints += 1;
															return false;
														} else {
															return true;
														}
													});

													if (hiddenPoints > 0 && isPossibleLinesCheck == false) {
														const message = `Точк${hiddenPoints == 1 ? 'а' : 'и'} (${hiddenPoints}) скрыт${hiddenPoints == 1 ? 'а' : 'ы'}
																			из списка согласно настройке сохранения последних сносок от избранных точек.`;
														const toast = createToast(message, 'top left', undefined, 'sbgcui_toast-selection');
														toast.showToast();
													}
												}

												const modifiedResponse = createResponse(parsedResponse, response);
												resolve(modifiedResponse);
											}
											break;
										case '/api/profile':
											if ('name' in parsedResponse) {
												regDateSpan.style.setProperty('--sbgcui-reg-date', calcPlayingTime(parsedResponse.created_at));
											}

											break;
										case '/api/repair':
											if ('data' in parsedResponse) {
												const guid = JSON.parse(options.body).guid;
												if (isPointPopupOpened) { lastOpenedPoint.updateCores(parsedResponse.data); }
												if (guid in inview) {
													const cores = parsedResponse.data.reduce((acc, curr) => { acc[curr.g] = { energy: curr.e, level: curr.l }; return acc; }, {});
													const totalEnergy = Point.calculateTotalEnergy(cores);
													inview[guid]?.update({ energy: totalEnergy });
												}
											}
											break;
										case '/api/score':
											if ('score' in parsedResponse) {
												const [points, regions] = parsedResponse.score;
												const pointsStatTds = document.querySelectorAll('.score__table > tbody td:first-of-type');
												const regionsStatTds = document.querySelectorAll('.score__table > tbody td:last-of-type');

												delete points.check;
												delete regions.check;

												const [pointsPlaces, regionsPlaces] = [points, regions].map(scores => Object.fromEntries(Object.entries(scores).sort((a, b) => b[1] - a[1]).map((e, i) => [e[0], i])));

												pointsStatTds.forEach((td, i) => { td.style.gridArea = `p${pointsPlaces[i == 0 ? 'r' : i == 1 ? 'g' : 'b']}`; });
												regionsStatTds.forEach((td, i) => { td.style.gridArea = `r${regionsPlaces[i == 0 ? 'r' : i == 1 ? 'g' : 'b']}`; });
											}

											break;
										case '/api/leaderboard':
											if (!('d' in parsedResponse)) { break; }

											const contributions = parsedResponse.d.reduce((total, entry) => {
												total[entry.t] = total[entry.t] ?? 0;
												total[entry.t] += entry.s;
												return total;
											}, []);
											const topContributor = contributions.findIndex(entry => entry == Math.max(...contributions.flat()));
											leaderboardPopup.style.setProperty('--sbgcui-top-team', `var(--team-${topContributor})`);

											break;
										default:
											resolve(response);
											return;
									}
								}).catch(error => {
									console.log('SBG CUI: Ошибка при обработке ответа сервера.', error);
									log.setError(error);
									log.save();
								}).finally(() => {
									resolve(response);
								});
							})
							.catch(error => {
								log.setError(error);
								log.save();
								reject(error);
							});
					});
				}
			}

			function toastifyDecorator(toastify) {
				return function (options) {
					if (options.text != undefined) {
						// Некоторые ответы сервера и некоторые локальные строки имеют точку в конце.
						// В виду отсутствия единой схемы удаляем точку везде.
						const text = options.text.toString().replace(/\.$/, '');
						const outOfRange = i18next.t('popups.point.range').replace(/\.$/, '');
						const networkFail = i18next.t('popups.network-fail').replace(/\.$/, '');
						const linesNone = i18next.t('popups.lines-none').replace(/\.$/, '');

						switch (text) {
							case outOfRange:
								options.gravity = 'top';
								options.position = 'right';
								break;
							case networkFail:
								options.gravity = 'top';
								options.position = 'center';
								break;
							case linesNone:
								options.className = 'error-toast';
								break;
						}
					}

					if (options.className?.startsWith('sbgcui_') == false) { options.selector = null; }

					// Есть баг в Toastify - значение oldestFirst всегда берётся
					// из дефолтного конфига тоста, даже если оно передано в options.
					// Поэтому здесь каждый раз изменяется дефолтное значение.
					toastify.defaults.oldestFirst = options.oldestFirst ?? true;

					options.style = {
						fontSize: '0.8em',
					};

					return toastify(options);
				}
			}

			function closePopupDecorator(closePopup) {
				switch (config.drawing.returnToPointInfo) {
					case 'off':
						closePopup(pointPopup); // Оригинальная функция работает с объектом JQ.
						break;
					case 'always':
						pointPopup.classList.remove('hidden');
						break;
					case 'discoverable':
						const guid = lastOpenedPoint.guid;
						const point = pointsSource.getFeatureById(guid);
						const cooldown = JSON.parse(localStorage.getItem('cooldowns') ?? '{}')[guid]?.t || 0;
						const isInRange = isPointInRange(point, lastOpenedPoint.coords);
						const isDiscoverable = new Date(cooldown) - Date.now() <= 0;
						if (isInRange && isDiscoverable) {
							pointPopup.classList.remove('hidden');
						} else {
							closePopup(pointPopup);
						}

						break;
				}
			}

			function clearTilesCache(event) {
				const transaction = database.transaction('tiles', 'readwrite');
				const tilesStore = transaction.objectStore('tiles');
				const clearButton = event.target;

				clearButton.disabled = true;
				clearButton.innerText = i18next.t('sbgcui.calculatingTilesCache');

				tilesStore.getAll().addEventListener('success', event => {
					const baselayers = new Set();
					const tiles = event.target.result;
					const storeCapacity = tiles.reduce((acc, tile) => {
						const layers = Object.keys(tile);
						const blobs = Object.values(tile);

						layers.forEach(layer => { baselayers.add(layer); });
						acc.amount += layers.length;
						acc.size += blobs.reduce((acc, blob) => acc += blob.size, 0);

						return acc;
					}, { amount: 0, size: 0 });

					const amount = storeCapacity.amount;
					const size = +(storeCapacity.size / 1024 / 1024).toFixed(1);
					const message = i18next.t('sbgcui.clearTilesCacheConfirm', { amount, size, baselayers: baselayers.size });
					confirm(message) && tilesStore.clear();

					clearButton.disabled = false;
					clearButton.innerText = i18next.t('sbgcui.clearTilesCache');
				});
			}

			function isAnyOverlayActive() {
				const isAnyDefaultPopupOpened = Array.from(document.querySelectorAll('.popup')).some(popup => !popup.classList.contains('hidden'));
				return (
					isAnyDefaultPopupOpened ||
					isDrawSliderOpened ||
					isAttackSliderOpened ||
					isClusterOverlayOpened ||
					isSettingsMenuOpened ||
					isFavsListOpened ||
					isLogsViewerOpened ||
					isRefsViewerOpened
				);
			}

			/* Данные о себе и версии игры */
			{
				const selfData = await getSelfData();
				const stateStore = database.transaction('state', 'readwrite').objectStore('state');

				if (LATEST_KNOWN_VERSION != gameVersion) {
					if (versionWarns < 2) {
						const message = `Текущая версия игры (${gameVersion}) не соответствует последней известной версии (${LATEST_KNOWN_VERSION}). Возможна некорректная работа.`;
						const toast = createToast(message, undefined, undefined, 'error-toast');
						toast.showToast();

						stateStore.put(versionWarns + 1, 'versionWarns');
					}
				} else {
					stateStore.put(0, 'versionWarns');
				}

				var player = {
					name: selfData.n,
					team: selfData.t,
					exp: {
						total: selfData.x,
						current: selfData.x - LEVEL_TARGETS.slice(0, selfData.l - 1).reduce((sum, e) => e + sum, 0),
						goal: LEVEL_TARGETS[selfData.l - 1],
						get percentage() { return (this.goal == Infinity) ? 100 : Math.min(this.current / this.goal * 100, 100); }, // На случай повторного добавления уровней больше 10-го.
						set string(str) { [this.current, this.goal = Infinity] = str.replace(/\s|,/g, '').split('/'); }
					},
					auth: localStorage.getItem('auth'),
					guid: selfData.g,
					feature: playerFeature,
					teamColor: getComputedStyle(html).getPropertyValue(`--team-${selfData.t}`),
					get level() { return this._level; },
					set level(str) { this._level = +str.split('').filter(e => e.match(/[0-9]/)).join(''); },
					_level: selfData.l,
				};
			}


			/* Стили */
			{
				let { mapFilters, ui } = config;
				let cssVars = document.createElement('style');
				let styles = document.createElement('link');
				let fa = document.createElement('link');
				let faSvg = document.createElement('link');

				cssVars.innerHTML = (`
      		:root {
      		  --sbgcui-player-exp-percentage: ${player.exp.percentage}%;
      		  --sbgcui-inventory-limit: "${INVENTORY_LIMIT}";
      		  --sbgcui-invert: ${mapFilters.invert};
      		  --sbgcui-hueRotate: ${mapFilters.hueRotate}deg;
      		  --sbgcui-brightness: ${mapFilters.brightness};
      		  --sbgcui-grayscale: ${mapFilters.grayscale};
      		  --sbgcui-sepia: ${mapFilters.sepia};
      		  --sbgcui-blur: ${mapFilters.blur}px;
      		  --sbgcui-point-bg: #ccc;
      		  --sbgcui-point-image: '';
      		  --sbgcui-point-image-blur: ${ui.pointBgImageBlur ? 2 : 0}px;
      		  --sbgcui-point-btns-rtl: ${ui.pointBtnsRtl ? 'rtl' : 'ltr'};
						--sbgcui-show-speedometer: ${ui.speedometer};
						--sbgcui-branding-color: ${mapFilters.branding == 'custom' ? mapFilters.brandingColor : player.teamColor};
						--team-${player.team}: var(--sbgcui-branding-color);
      		}
  			`);

				if (mapFilters.branding == 'custom' && window.TeamColors && window.TeamColors[player.team]) {
					window.TeamColors[player.team].fill = () => mapFilters.brandingColor + '80';
					window.TeamColors[player.team].stroke = () => hex623(mapFilters.brandingColor);
				}

				[styles, fa, faSvg].forEach(e => e.setAttribute('rel', 'stylesheet'));

				styles.setAttribute('href', `${HOME_DIR}/styles.min.css`);
				fa.setAttribute('href', `${HOME_DIR}/assets/fontawesome/css/fa.min.css`);
				faSvg.setAttribute('href', `${HOME_DIR}/assets/fontawesome/css/fa-svg.min.css`);

				document.head.append(cssVars, fa, faSvg, styles);
			}


			/* Мутации */
			{
				let lvlObserver = new MutationObserver((_, observer) => {
					observer.disconnect();

					player.level = selfLvlSpan.textContent;
					selfLvlSpan.innerText = (player.level <= 9 ? '0' : '') + player.level;

					observer.observe(selfLvlSpan, { childList: true });
				});
				lvlObserver.observe(selfLvlSpan, { childList: true });


				let pointLevelObserver = new MutationObserver(records => {
					let event = new Event('pointLevelChanged', { bubbles: true });
					pointLevelSpan.dispatchEvent(event);
				});
				pointLevelObserver.observe(pointLevelSpan, { childList: true });


				let pointOwnerObserver = new MutationObserver(records => {
					let event = new Event('pointOwnerChanged', { bubbles: true });
					pointOwnerSpan.dispatchEvent(event);
				});
				pointOwnerObserver.observe(pointOwnerSpan, { childList: true });


				let pointCoresObserver = new MutationObserver(records => {
					let event = new Event('pointCoresUpdated', { bubbles: true });
					pointCores.dispatchEvent(event);
				});
				pointCoresObserver.observe(pointCores, { childList: true });


				let pointPopupObserver = new MutationObserver(records => {
					let event;

					if (records[0].target.classList.contains('hidden')) {
						event = new Event('pointPopupClosed');
						isPointPopupOpened = false;
					} else if (records[0].oldValue?.includes('hidden')) {
						event = new Event('pointPopupOpened');
						isPointPopupOpened = true;
					}

					if (event) { records[0].target.dispatchEvent(event); }
				});
				pointPopupObserver.observe(pointPopup, { attributes: true, attributeOldValue: true, attributeFilter: ['class'] });


				let leaderboardPopupObserver = new MutationObserver(records => {
					let event;

					if (records[0].target.classList.contains('hidden')) {
						event = new Event('leaderboardPopupClosed');
						isleaderboardPopupOpened = false;
					} else if (records[0].oldValue?.includes('hidden')) {
						event = new Event('leaderboardPopupOpened');
						isleaderboardPopupOpened = true;
					}

					if (event) { records[0].target.dispatchEvent(event); }
				});
				leaderboardPopupObserver.observe(leaderboardPopup, { attributes: true, attributeOldValue: true, attributeFilter: ['class'] });


				let profilePopupObserver = new MutationObserver(records => {
					isProfilePopupOpened = !records[0].target.classList.contains('hidden');
					let event = new Event(isProfilePopupOpened ? 'profilePopupOpened' : 'profilePopupClosed', { bubbles: true });
					records[0].target.dispatchEvent(event);
				});
				profilePopupObserver.observe(profilePopup, { attributes: true, attributeFilter: ['class'] });


				let inventoryPopupObserver = new MutationObserver(records => {
					isInventoryPopupOpened = !records[0].target.classList.contains('hidden');
					let event = new Event(isInventoryPopupOpened ? 'inventoryPopupOpened' : 'inventoryPopupClosed');
					records[0].target.dispatchEvent(event);
				});
				inventoryPopupObserver.observe(inventoryPopup, { attributes: true, attributeFilter: ['class'] });


				let attackSliderObserver = new MutationObserver(records => {
					isAttackSliderOpened = !records[0].target.classList.contains('hidden');
					let event = new Event(isAttackSliderOpened ? 'attackSliderOpened' : 'attackSliderClosed');
					records[0].target.dispatchEvent(event);
				});
				attackSliderObserver.observe(attackSlider, { attributes: true, attributeFilter: ['class'] });


				let drawSliderObserver = new MutationObserver(records => {
					isDrawSliderOpened = !records[0].target.classList.contains('hidden');
					let event = new Event(isDrawSliderOpened ? 'drawSliderOpened' : 'drawSliderClosed');
					records[0].target.dispatchEvent(event);
				});
				drawSliderObserver.observe(drawSlider, { attributes: true, attributeFilter: ['class'] });


				let xpDiffSpanObserver = new MutationObserver(records => {
					let xp = records.find(e => e.addedNodes.length).addedNodes[0].data.match(/\d+/)[0];
					showXp(xp);
				});
				xpDiffSpanObserver.observe(xpDiffSpan, { childList: true });


				let refsListObserver = new MutationObserver(() => {
					let refs = Array.from(document.querySelectorAll('.inventory__content[data-tab="3"] > .inventory__item'));

					if (refs.every(e => e.classList.contains('loaded'))) {
						let event = new Event('refsListLoaded');
						inventoryContent.dispatchEvent(event);
					}
				});
				refsListObserver.observe(inventoryContent, { subtree: true, attributes: true, attributeFilter: ['class'] });


				let catalysersListObserver = new MutationObserver(records => {
					if (!isAttackSliderOpened) { return; }

					const attributesRecords = [...records].filter(r => r.type == 'attributes');
					const childListRecords = [...records].filter(r => r.type == 'childList');

					const isActiveSwitched = attributesRecords.some(r => r.oldValue.includes('is-active') && !r.target.classList.contains('is-active'));
					const isEverySlideAddedNow = childListRecords.length > 0 && childListRecords.every(r => r.addedNodes.length == 1 && r.removedNodes.length == 0);

					if (isActiveSwitched || isEverySlideAddedNow) {
						let event = new Event('activeSlideChanged');
						catalysersList.dispatchEvent(event);
					}
				});
				catalysersListObserver.observe(catalysersList, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });


				let coresListObserver = new MutationObserver(records => {
					let event = new Event('coresListUpdated');
					coresList.dispatchEvent(event);
				});
				coresListObserver.observe(coresList, { childList: true });


				let toggleFollowObserver = new MutationObserver(records => {
					isFollow = toggleFollow.dataset.active == 'true';
					dragPanInteraction.setActive(!isFollow);
				});
				toggleFollowObserver.observe(toggleFollow, { attributes: true, attributeFilter: ['data-active'] });
			}


			/* Прочие события */
			{
				attackButton.addEventListener('click', () => { attackButton.classList.toggle('sbgcui_attack-menu-rotate'); });

				pointPopup.addEventListener('pointPopupOpened', () => {
					let settings = JSON.parse(localStorage.getItem('settings')) || {};

					if (config.ui.pointBgImage) {
						html.style.setProperty(`--sbgcui-point-image`, settings.imghid ? '' : `url("${lastOpenedPoint.image}")`);
						pointPopup.classList.add('sbgcui_point-popup-bg');
						pointImage.classList.add('sbgcui_no_bg_image');
					} else {
						html.style.setProperty(`--sbgcui-point-image`, '');
						pointPopup.style.backgroundImage = '';
						pointPopup.classList.remove('sbgcui_point-popup-bg');
						pointImage.classList.remove('sbgcui_no_bg_image');
					}

					pointEnergyValue.innerText = `${lastOpenedPoint.energyFormatted}% @ ${lastOpenedPoint.coresAmount}`;
				});

				pointPopup.addEventListener('pointRepaired', () => {
					pointEnergyValue.innerText = `${lastOpenedPoint.energyFormatted}% @ ${lastOpenedPoint.coresAmount}`;
				});

				document.addEventListener("backbutton", () => {
					if (isProfilePopupOpened) {
						click(pointPopupCloseButton);
					} else if (isPointPopupOpened) {
						click(profilePopupCloseButton);
					}
					return false;
				});

				document.querySelector('.inventory__tab[data-tab="3"]').addEventListener('click', () => {
					let counter = document.querySelector('.inventory__tab[data-tab="3"] > .inventory__tab-counter');
					let refsAmount = JSON.parse(localStorage.getItem('inventory-cache')).reduce((acc, item) => item.t == 3 ? acc + item.a : acc, 0);
					let uniqueRefsAmount = inventoryContent.childNodes.length;

					counter.innerText = uniqueRefsAmount;
					setTimeout(() => { counter.innerText = refsAmount; }, 1000);
				});

				toggleFollow.addEventListener('touchstart', () => {
					function resetView(isCompleted) {
						if (isCompleted) { return; }

						view.animate(
							{ center: player.feature.getGeometry().getCoordinates() },
							{ zoom: 17 },
							{ rotation: 0 },
							resetView
						);
					}

					let touchStartDate = Date.now();

					let timeoutID = setTimeout(resetView, 500);

					this.addEventListener('touchend', () => {
						let touchDuration = Date.now() - touchStartDate;
						if (touchDuration < 1000) { clearTimeout(timeoutID); } else { return; }
					}, { once: true });
				});

				drawSlider.addEventListener('drawSliderOpened', () => {
					view.setBottomPadding();
					view.set('beforeDrawZoom', view.getZoom());

					hideControls();

					// Маленький костылёчек, который позволяет правильно центрировать вью при первом открытии слайдера.
					// Иначе не успевает отработать MutationObserver, эмитящий эвент drawSliderOpened.
					window.draw_slider.emit('active', { slide: drawSlider.querySelector('.splide__slide.is-active') });
				});

				drawSlider.addEventListener('drawSliderClosed', () => {
					const center = playerFeature.getGeometry().getCoordinates();
					const zoom = view.get('beforeDrawZoom') || 17;

					view.setTopPadding();
					view.setCenter(center);
					view.setZoom(zoom);

					showControls();
				});

				portrait.addEventListener('change', () => {
					portrait.matches ? view.setTopPadding() : view.removePadding();
					view.setCenter(playerFeature.getGeometry().getCoordinates());
				});

				window.addEventListener('refAquired', () => {
					refsAmount.classList.add('sbgcui_heartBeat');
				});

				refsAmount.addEventListener('animationend', () => {
					refsAmount.classList.remove('sbgcui_heartBeat');
				});

				pointPopup.addEventListener('pointPopupClosed', () => {
					refsAmount.classList.remove('sbgcui_heartBeat');
				});
			}


			/* Удаление ненужного, переносы, переименования */
			{
				const ops = document.querySelector('#ops');
				const rotateArrow = document.querySelector('.ol-rotate');
				const layersButton = document.querySelector('#layers');
				const attackSliderClose = document.querySelector('#attack-slider-close');
				const pointEnergy = document.createElement('div');
				const pointEnergyLabel = document.createElement('span');
				const pointOwner = document.querySelector('#i-stat__owner').parentElement;
				const highlevelCatalyserWarn = document.querySelector('.attack-slider-highlevel');
				const popupCloseButtons = document.querySelectorAll('.popup-close, #inventory__close');
				const drawButtonText = drawButton.childNodes[0];
				const drawButtonTextWrapper = document.createElement('span');

				attackSlider.prepend(highlevelCatalyserWarn);

				document.querySelectorAll('[data-i18n="self-info.name"], [data-i18n="self-info.xp"], [data-i18n="units.pts-xp"], [data-i18n="self-info.inventory"], [data-i18n="self-info.position"]').forEach(e => { e.remove(); });
				document.querySelectorAll('.self-info__entry').forEach(e => {
					let toDelete = [];

					e.childNodes.forEach(e => {
						if (e.nodeType == 3) { toDelete.push(e); }
					});

					toDelete.forEach(e => { e.remove(); });
				});
				document.querySelector('.i-stat__tools').remove();

				attackSliderClose.remove(); // Кнопка закрытия слайдера не нужна.
				attackButton.childNodes[0].remove(); // Надпись Attack.

				layersButton.innerText = '';
				layersButton.classList.add('fa', 'fa-solid-layer-group');

				notifsButton.innerText = '';
				notifsButton.classList.add('fa', 'fa-solid-envelope');

				zoomContainer.append(rotateArrow, toggleFollow, notifsButton, layersButton);

				toggleFollow.innerText = '';
				toggleFollow.classList.add('fa', 'fa-solid-location-crosschairs');

				blContainer.appendChild(ops);

				ops.replaceChildren(invTotalSpan);

				selfLvlSpan.innerText = (player.level <= 9 ? '0' : '') + player.level;

				pointEnergy.classList.add('i-stat__entry');
				pointEnergyLabel.innerText = i18next.t('info.energy');
				pointEnergyValue.id = 'i-stat__energy';
				pointEnergy.append(pointEnergyLabel, ': ', pointEnergyValue);
				pointOwner.after(pointEnergy);

				drawButtonTextWrapper.append(drawButtonText);
				drawButton.appendChild(drawButtonTextWrapper);

				popupCloseButtons.forEach(button => {
					if (button.closest('.info, .inventory, .leaderboard, .notifs, .profile, .settings')) {
						button.innerHTML = '';
						button.classList.add('sbgcui_button_reset', 'fa', 'fa-solid-xmark');
					}
				});

				i18next.addResources('ru', 'main', {
					'notifs.text': 'нейтрализована $1$',
					'sbgcui.point': 'Точка',
					'sbgcui.points': 'Точки',
					'sbgcui.line': 'Линия',
					'sbgcui.lines': 'Линии',
					'sbgcui.region': 'Регион',
					'sbgcui.regions': 'Регионы',
					'sbgcui.oldestLineDays': 'Самая старая линия (дн.)',
					'sbgcui.oldestRegionDays': 'Самый старый регион (дн.)',
					'sbgcui.refsShort': 'СНК',
					'sbgcui.max': 'Макс.',
					'sbgcui.total': 'Всего',
					'sbgcui.area': 'Площадь',
					'sbgcui.distance': 'Расстояние',
					'sbgcui.clearTilesCache': 'Очистить кэш',
					'sbgcui.clearTilesCacheConfirm': 'Очистить кэш тайлов карты? \n{{amount}} тайлов от {{baselayers}} подложек. Всего {{size}} МБ занято.',
					'sbgcui.calculatingTilesCache': 'Подсчёт...',
					'sbgcui.captured': 'Захвачена: {{date}} ({{guard}} дн.)',
					'sbgcui.guard': 'Захвачена: {{guard}} дн. назад',
					'sbgcui.sort-none': 'Сортировать по:',
					'sbgcui.sort-title': 'Названию',
					'sbgcui.sort-level': 'Уровню',
					'sbgcui.sort-team': 'Команде',
					'sbgcui.sort-energy': 'Заряду',
					'sbgcui.sort-distance': 'Расстоянию',
					'sbgcui.sort-amount': 'Количеству',
					'sbgcui.sort-guard': 'Гарду',
				});
				i18next.addResources('en', 'main', {
					'notifs.text': 'neutralized by $1$',
					'sbgcui.point': 'Point',
					'sbgcui.points': 'Points',
					'sbgcui.line': 'Line',
					'sbgcui.lines': 'Lines',
					'sbgcui.region': 'Region',
					'sbgcui.regions': 'Regions',
					'sbgcui.oldestLineDays': 'Oldest line (days)',
					'sbgcui.oldestRegionDays': 'Oldest region (days)',
					'sbgcui.refsShort': 'REF',
					'sbgcui.max': 'Max',
					'sbgcui.total': 'Total',
					'sbgcui.area': 'Area',
					'sbgcui.distance': 'Distance',
					'sbgcui.clearTilesCache': 'Clear cache',
					'sbgcui.clearTilesCacheConfirm': 'Clear map tiles cache? \n{{amount}} tiles from {{baselayers}} baselayers. Total {{size}} MB used.',
					'sbgcui.calculatingTilesCache': 'Calculating...',
					'sbgcui.captured': 'Captured: {{date}} ({{guard}} d.)',
					'sbgcui.guard': 'Captured: {{guard}} d. ago',
					'sbgcui.sort-none': 'Sort by:',
					'sbgcui.sort-title': 'Title',
					'sbgcui.sort-level': 'Level',
					'sbgcui.sort-team': 'Team',
					'sbgcui.sort-energy': 'Energy',
					'sbgcui.sort-distance': 'Distance',
					'sbgcui.sort-amount': 'Amount',
					'sbgcui.sort-guard': 'Guard',
				});
				i18next.addResources(i18next.resolvedLanguage ?? 'en', 'main', {
					'items.catalyser-short': '{{level}}',
					'items.core-short': '{{level}}',
				});
				['cm', 'm', 'km', 'sqm', 'sqkm'].forEach(unit => {
					const key = `units.${unit}`;
					let value = i18next.getResource(i18next.resolvedLanguage ?? 'en', 'main', key);
					value = value.replace(/(maximumFractionDigits:\s)(\d)/, '$1$2; minimumFractionDigits: $2');
					i18next.addResource(i18next.resolvedLanguage ?? 'en', 'main', key, value);
				});

				window.attack_slider.options = {
					speed: 200,
				};
				window.deploy_slider.options = {
					speed: 200,
				};
				window.draw_slider.options = {
					height: '120px',
					pagination: true,
					speed: 200,
					//perPage: 2,
				};

				window.highlightFeature = highlightFeature;

				viewportMeta.setAttribute('content', viewportMeta.getAttribute('content') + ', shrink-to-fit=no');

				const mapConfig = JSON.parse(localStorage.getItem('map-config'));
				mapConfig.h = 0;
				localStorage.setItem('map-config', JSON.stringify(mapConfig));
			}


			/* Доработка карты */
			{
				let attributionControl, rotateControl;
				var dragPanInteraction, doubleClickZoomInteraction, pinchRotateInteraction;
				var toolbar = new Toolbar('MainToolbar');
				const controls = map.getControls();
				const interactions = map.getInteractions();

				interactions.forEach(interaction => {
					switch (interaction.constructor) {
						case ol.interaction.DragPan:
							dragPanInteraction = interaction;
							break;
						case ol.interaction.DoubleClickZoom:
							doubleClickZoomInteraction = interaction;
							break;
						case ol.interaction.PinchRotate:
							pinchRotateInteraction = interaction;
							break;
					}
				});

				dragPanInteraction.setActive(toggleFollow.dataset.active != 'true');
				doubleClickZoomInteraction.setActive(Boolean(config.ui.doubleClickZoom));


				controls.forEach(control => {
					switch (control.constructor) {
						case ol.control.Attribution:
							attributionControl = control;
							break;
						case ol.control.Rotate:
							rotateControl = control;
							break;
					}
				});

				map.removeControl(attributionControl);
				map.removeControl(rotateControl);
				map.addControl(toolbar);

				// const stadiaWatercolorLabel = document.createElement('label');
				// const stadiaTonerLabel = document.createElement('label');
				// const yandexLabel = document.createElement('label');

				const osmToggle = document.querySelector('input[value="osm"]')
				const addLayers = [
					{ value: 'stadia_watercolor', title: 'Stadia Watercolor' },
					{ value: 'stadia_toner', title: 'Stadia Toner' },
					{ value: 'ymaps', title: 'Yandex' },
				]

				addLayers.forEach((layer) => {

					let label = document.createElement('label');
					const input = document.createElement('input');
					const span = document.createElement('span');
					const isSelected = JSON.parse(localStorage.getItem('settings')).base == layer.value;

					label.classList.add('layers-config__entry');

					input.type = 'radio';
					input.name = 'baselayer';
					input.value = layer.value;
					input.checked = isSelected;

					span.innerText = layer.title

					label.append(input, ' ', span);
					osmToggle.parentElement.after(label);
				});

				// osmToggle.parentElement.after(stadiaWatercolorLabel, stadiaTonerLabel);

				const clearTilesCacheButton = document.createElement('button');
				const layersConfigButtons = document.querySelector('.layers-config__buttons');
				clearTilesCacheButton.innerText = i18next.t('sbgcui.clearTilesCache');
				clearTilesCacheButton.addEventListener('click', clearTilesCache);
				layersConfigButtons.appendChild(clearTilesCacheButton);


				var customPointsSource = new ol.source.Vector();
				var customPointsLayer = new ol.layer.Vector({
					source: customPointsSource,
					name: 'sbgcui_points',
					minZoom: 15,
					className: 'ol-layer__sbgcui_points',
					zIndex: 9
				});
				map.addLayer(customPointsLayer);

				view.setRotation(config.ui.restoreRotation ? (state.viewRotation ?? 0) : 0);
			}


			/* Прогресс-бар опыта */
			{
				let xpProgressBar = document.createElement('div');
				let xpProgressBarFiller = document.createElement('div');
				let selfExpSpan = document.querySelector('#self-info__exp');

				let lvlProgressObserver = new MutationObserver(() => {
					player.exp.string = selfExpSpan.textContent;
					html.style.setProperty('--sbgcui-player-exp-percentage', `${player.exp.percentage}%`);
				});
				lvlProgressObserver.observe(selfExpSpan, { childList: true });

				xpProgressBar.classList.add('sbgcui_xpProgressBar');
				xpProgressBarFiller.classList.add('sbgcui_xpProgressBarFiller');

				selfExpSpan.parentElement.prepend(xpProgressBar);
				xpProgressBar.append(selfExpSpan, xpProgressBarFiller);
			}


			/* Автовыбор */
			{
				attackSlider.addEventListener('attackSliderOpened', () => {
					click(chooseCatalyser(config.autoSelect.attack));
				});

				pointCores.addEventListener('click', event => {
					if (event.target.classList.contains('selected')) {
						const guid = event.target.dataset.guid;
						const currentLvl = lastOpenedPoint.cores[guid].level;
						lastOpenedPoint.selectCore(config.autoSelect.upgrade, currentLvl);
					}
				});

				coresList.addEventListener('touchstart', event => {
					let coreSlide = event.target.closest('.is-active.splide__slide');
					if (coreSlide == null) { return; }

					let touchStartDate = Date.now();
					let guid = coreSlide.dataset.guid;

					let timeoutID = setTimeout(() => {
						let toast;

						if (excludedCores.has(guid)) {
							excludedCores.delete(guid);
							coreSlide.removeAttribute('sbgcui-excluded-core');
							toast = createToast('Теперь ядро доступно для автовыбора.');
						} else {
							excludedCores.add(guid);
							coreSlide.setAttribute('sbgcui-excluded-core', '');
							toast = createToast('Ядро больше не участвует в автовыборе.');
						}

						toast.showToast();
						database.transaction('state', 'readwrite').objectStore('state').put(excludedCores, 'excludedCores');
					}, 2000);

					coreSlide.addEventListener('touchend', () => {
						let touchDuration = Date.now() - touchStartDate;
						if (touchDuration < 2000) { clearTimeout(timeoutID); } else { return; }
					}, { once: true });
				});

				coresList.addEventListener('coresListUpdated', () => {
					coresList.childNodes.forEach(coreSlide => {
						if (excludedCores.has(coreSlide.dataset.guid)) {
							coreSlide.setAttribute('sbgcui-excluded-core', '');
						}
					});
					const selectedCoreGuid = lastOpenedPoint.selectedCoreGuid;
					if (selectedCoreGuid != undefined) {
						const selectedCoreLvl = lastOpenedPoint.cores[selectedCoreGuid].level;
						lastOpenedPoint.selectCore(config.autoSelect.upgrade, selectedCoreLvl);
					} else {
						lastOpenedPoint.selectCore(config.autoSelect.deploy);
					}
				});
			}


			/* Зарядка из инвентаря */
			{
				function makeEntryDecorator(originalMakeEntry) {
					return function (e, data) {
						if (data.te == player.team) {
							e.style.setProperty('--sbgcui-energy', `${data.e}%`);
							if (data.e < 100) {
								e.style.setProperty('--sbgcui-display-r-button', 'flex');
								e.setAttribute('sbgcui-repairable', '');
							}
						} else {
							e.style.removeProperty('--sbgcui-energy');
							e.style.removeProperty('--sbgcui-display-r-button', 'flex');
							e.removeAttribute('sbgcui-repairable');
						}

						return originalMakeEntry(e, data);
					};
				}

				function recursiveRepair(pointGuid, refEntry) {
					repairPoint(pointGuid)
						.then(r => {
							if (r.error) {
								throw new Error(r.error);
							} else if (r.data) {
								const [pointEnergy, maxEnergy] = r.data.reduce((result, core) => [result[0] + core.e, result[1] + CORES_ENERGY[core.l]], [0, 0]);
								const refInfoDiv = document.querySelector(`.inventory__item[data-ref="${pointGuid}"] .inventory__item-left`);
								const refInfoEnergy = refInfoDiv.querySelector('.inventory__item-descr').childNodes[4];
								const percentage = Math.floor(pointEnergy / maxEnergy * 100);
								const refsCache = JSON.parse(localStorage.getItem('refs-cache'));

								refEntry.style.setProperty('--sbgcui-energy', `${percentage}%`);

								if (refInfoEnergy) { refInfoEnergy.nodeValue = percentage; }

								updateExpBar(r.xp.cur);
								showXp(r.xp.diff);

								if (refsCache[pointGuid]) {
									refsCache[pointGuid].e = percentage;
									localStorage.setItem('refs-cache', JSON.stringify(refsCache));
								}

								// Ивент позволяет обновить массив данных точек, который используется для сортировки.
								const event = new CustomEvent('pointRepaired', { detail: { guid: pointGuid, energy: percentage } });
								inventoryContent.dispatchEvent(event);

								if (percentage != 100) { recursiveRepair(...arguments); }
							}
						})
						.catch(error => {
							const toast = createToast(`Ошибка при зарядке. <br>${error.message}`, undefined, undefined, 'error-toast');
							toast.showToast();

							console.log('SBG CUI: Ошибка при зарядке.', error);

							if (error.message.match(/полностью|вражеской|fully|enemy/)) {
								refEntry.style.setProperty('--sbgcui-display-r-button', 'none');
							} else {
								refEntry.style.setProperty('--sbgcui-display-r-button', 'flex');
							}
						});
				}

				function keyupHandler(event) {
					if (event.code != 'KeyR') { return; }

					const refEntry = document.querySelector('.inventory__item[sbgcui-repairable]');
					const pointGuid = refEntry?.dataset.ref;

					if (refEntry == null) { return; }

					recursiveRepair(pointGuid, refEntry);
					refEntry.scrollIntoView();
					refEntry.removeAttribute('sbgcui-repairable');
					refEntry.style.setProperty('--sbgcui-display-r-button', 'none');
				}

				window.makeEntry = makeEntryDecorator(window.makeEntry);

				inventoryContent.addEventListener('click', event => {
					if (!event.currentTarget.matches('.inventory__content[data-tab="3"]')) { return; }
					if (!event.target.closest('.inventory__item-controls')) { return; }
					if (!event.target.closest('.inventory__item.loaded')) { return; }
					if (event.target.className === 'inventory__ic-view') { return; }

					// Ширина блока кнопок "V M" около 30 px.
					// Правее них находится кнопка-псевдоэлемент "R".
					// Если нажато дальше 30px (50 – с запасом на возможное изменение стиля), значит нажата псевдокнопка, если нет – одна из кнопок V/M.
					// Приходится указывать конкретное число (50), потому что кнопка V при нажатии получает display: none и не имеет offsetWidth.
					if (event.offsetX < 50) { return; }

					const pointGuid = event.target.closest('.inventory__item')?.dataset.ref;
					const refEntry = event.target.closest('.inventory__item');

					refEntry.style.setProperty('--sbgcui-display-r-button', 'none');

					recursiveRepair(pointGuid, refEntry);
				});

				inventoryPopup.addEventListener('inventoryPopupOpened', () => { document.addEventListener('keyup', keyupHandler); });
				inventoryPopup.addEventListener('inventoryPopupClosed', () => { document.removeEventListener('keyup', keyupHandler); });
			}


			/* Меню настроек */
			{
				function closeDetails(event) {
					// Если передан event - будут закрыты все details кроме нажатого.
					// Если не передан - будут закрыты все details.
					if (event != undefined && !event.target.matches('summary')) { return; }

					settingsMenu.querySelectorAll('details').forEach(element => {
						if (event == undefined || element != event.target.closest('details')) {
							element.removeAttribute('open');
						}
					});
				}

				function onBrandingInputChange() {
					// Приводим цвет к виду #RRGGBB, т.к. основной скрипт для линий использует четырёхзначную нотацию (RGB + альфа).
					brandingInput.value = hex623(brandingInput.value, false);
				}

				function onBrandingInputInput(event) {
					if (brandingSelect.value == 'default') { brandingSelect.value = 'custom'; }
					html.style.setProperty(`--sbgcui-branding-color`, hex623(event.target.value));
				}

				function onBrandingSelectChange(event) {
					if (event.target.value == 'default') {
						brandingInput.value = hex326(player.teamColor);
						html.style.setProperty('--sbgcui-branding-color', player.teamColor);
					} else {
						brandingInput.value = config.mapFilters.brandingColor;
						html.style.setProperty('--sbgcui-branding-color', config.mapFilters.brandingColor);
					}
				}

				function onCloseButtonClick(event) {
					event.preventDefault();
					event.stopPropagation();

					const { mapFilters, ui } = config;

					// Возвращаем фильтрам последние сохранённые значения, т.к. CSS переменные
					// меняются, чтобы в процессе показать, как будет выглядеть.
					for (let filter in mapFilters) {
						setFilterCSSVar(filter, mapFilters[filter]);
					}

					html.style.setProperty('--sbgcui-point-btns-rtl', ui.pointBtnsRtl ? 'rtl' : 'ltr');
					html.style.setProperty('--sbgcui-point-image-blur', ui.pointBgImageBlur ? '2px' : '0px');
					html.style.setProperty('--sbgcui-show-speedometer', ui.speedometer);
					html.style.setProperty('--sbgcui-branding-color', mapFilters.branding == 'custom' ? mapFilters.brandingColor : player.teamColor);
					window.TeamColors[player.team].fill = () => `${mapFilters.branding == 'custom' ? mapFilters.brandingColor : hex326(player.teamColor)}80`;
					window.TeamColors[player.team].stroke = () => mapFilters.branding == 'custom' ? hex623(mapFilters.brandingColor) : player.teamColor;

					doubleClickZoomInteraction.setActive(Boolean(ui.doubleClickZoom));

					if (config.tinting.map && !isPointPopupOpened && !isProfilePopupOpened) { addTinting('map'); }

					closeDetails();
					setStoredInputsValues();

					settingsMenu.classList.add('sbgcui_hidden');
					isSettingsMenuOpened = false;
				}

				function onColorFilterInput(event) {
					const { name, value } = event.target;
					const filter = name.split('_')[1];
					setFilterCSSVar(filter, value);
				}

				function onForceClearButtonClick(event) {
					event.preventDefault();
					confirm('Произвести очистку инвентаря согласно настройкам?') && clearInventory(true);
				}

				function onFormSubmit(event) {
					event.preventDefault();

					try {
						const formData = new FormData(event.target);
						const formEntries = Object.fromEntries(formData);

						for (let entry in formEntries) {
							const path = entry.split('_');
							const section = path[0];

							if (section == 'maxAmountInBag') {
								const item = path[1], level = path[2];
								const amount = isValidAmount(formEntries[entry]) ? +formEntries[entry] : -1;

								config.maxAmountInBag[item][level] = amount;
							} else {
								const param = path[1];
								const value = formEntries[entry];

								config[section][param] = isNaN(+value) ? value : +value;
							}
						}

						for (let section in config) {
							database.transaction('config', 'readwrite').objectStore('config').put(config[section], section);
						}

						showToast('Настройки сохранены');
						window.dispatchEvent(new Event('configUpdated'));
					} catch (error) {
						showToast(`Ошибка при сохранении настроек. <br>${error.message}`, undefined, undefined, 'error-toast');
						console.log('SBG CUI: Ошибка при сохранении настроек.', error);
					}
				}

				function onMapTintingInputChange(event) {
					event.target.checked ? addTinting('map') : addTinting('');
				}

				function onMarkerSelectChange(event) {
					const select = event.target;
					const value = select.value;

					// Можно использовать либо один целый наружный маркер (outerMarker), либо два полукольца –
					// верхнее и нижнее (outerTop, outerBottom). Если выбран целый маркер, отключаем селекты полуколец.
					// Если выбраны полукольца – отключаем селект целого.
					switch (select) {
						case outerMarkerSelect:
							switchMarkersSelectsOff([outerTopMarkerSelect, outerBottomMarkerSelect]);
							break;
						case outerTopMarkerSelect:
						case outerBottomMarkerSelect:
							switchMarkersSelectsOff([outerMarkerSelect]);
							break;
					}

					// Можно узнать только одно значение за запрос – либо уникальный захват, либо уникальное посещение.
					// Если выбрано uniqc, отключаем uniqv во всех остальных селектах и наоборот.
					if (/^uniq(c|v)$/.test(value)) {
						const selectsToOff = markersSelects.filter(e => e != select);
						switchMarkersSelectsOff(selectsToOff, value);
					}
				}

				function onMaxAmountInBagInputFocus(event) {
					const input = event.target;
					input.select();
				}

				function onMaxAmountInBagInputChange(event) {
					const input = event.target;

					if (!isValidAmount(input.value)) {
						input.value = -1;
						input.setAttribute('data-amount', input.value);
					}
				}

				function onMaxAmountInBagInputInput(event) {
					const input = event.target;
					input.setAttribute('data-amount', input.value);
				}

				function onNotificationsDurationInputInput(event) {
					const value = event.target.value;
					event.target.setAttribute('label', `${value == -1 ? '∞' : Math.round(value / 1000)} сек.`);
				}

				function onNotificationsIntervalInputInput(event) {
					const value = event.target.value;
					event.target.setAttribute('label', `${value / 1000} сек.`);
				}

				function onPointBgImageCheckboxChange(event) {
					if (event.target.checked) {
						pointBgImageBlurCheckbox.removeAttribute('disabled');
					} else {
						pointBgImageBlurCheckbox.checked = 0;
						pointBgImageBlurCheckbox.setAttribute('disabled', '');
					}
				}

				function onToolbarButtonClick() {
					settingsMenu.classList.toggle('sbgcui_hidden');
					isSettingsMenuOpened = !isSettingsMenuOpened;
				}

				function setStoredInputsValues() {
					settingsMenu.querySelectorAll('input:not([type="hidden"]), select').forEach(input => {
						const path = input.name.split('_');
						const value = path.reduce((obj, prop) => obj[prop], config);

						switch (input.type) {
							case 'color':
							case 'number':
							case 'range':
							case 'select-one':
								input.value = value;
								break;
							case 'checkbox':
								input.checked = value;
								break;
							case 'radio':
								input.checked = input.value == value;
								break;
						}
					});

					// Диспатчим эвенты на инпутах, у которых есть текстовые/цветовые маркеры, меняющиеся при вводе.
					[
						...maxAmountInBagInputs,
						notificationsDurationInput,
						notificationsIntervalInput
					].forEach(input => { input.dispatchEvent(new Event('input')); });
				}

				function setFilterCSSVar(filter, value) {
					const units = (filter == 'blur') ? 'px' : (filter == 'hueRotate') ? 'deg' : '';
					html.style.setProperty(`--sbgcui-${filter}`, `${value}${units}`);
				}

				function switchMarkersSelectsOff(selects, option) {
					selects.forEach(select => {
						switch (option) {
							case 'uniqc':
								if (select.value == 'uniqv') { select.value = 'off'; }
								break;
							case 'uniqv':
								if (select.value == 'uniqc') { select.value = 'off'; }
								break;
							default:
								select.value = 'off';
						}
					});
				}

				const isValidAmount = value => !(value == '' || value == '-0' || Number.isInteger(+value) == false || +value < -1);

				try {
					var settingsMenu = await getHTMLasset('settings');

					var brandingSelect = settingsMenu.querySelector('select[name="mapFilters_branding"]');
					var brandingInput = settingsMenu.querySelector('input[name="mapFilters_brandingColor"]');
					const closeButton = settingsMenu.querySelector('#sbgcui_settings-close');
					const colorFiltersInputs = settingsMenu.querySelectorAll('input[data-role="colorfilter"]');
					var forceClearButton = settingsMenu.querySelector('#sbgcui_forceclear');
					const highlevelMarkersOptions = settingsMenu.querySelectorAll('option[value="highlevel"]');
					var innerMarkerSelect = settingsMenu.querySelector('select[name="pointHighlighting_inner"]');
					const mapTintingInput = settingsMenu.querySelector('#tinting_map');
					var maxAmountInBagInputs = settingsMenu.querySelectorAll('.sbgcui_settings-maxamounts input[name^="maxAmountInBag"]');
					const minFreeSpaceSpan = settingsMenu.querySelector('#sbgcui_min_free_space');
					var notificationsDurationInput = settingsMenu.querySelector('input[name="notifications_duration"]');
					var notificationsIntervalInput = settingsMenu.querySelector('input[name="notifications_interval"]');
					var outerBottomMarkerSelect = settingsMenu.querySelector('select[name="pointHighlighting_outerBottom"]');
					var outerMarkerSelect = settingsMenu.querySelector('select[name="pointHighlighting_outer"]');
					var outerTopMarkerSelect = settingsMenu.querySelector('select[name="pointHighlighting_outerTop"]');
					const pointBgImageCheckbox = settingsMenu.querySelector('#ui_pointBgImage');
					var pointBgImageBlurCheckbox = settingsMenu.querySelector('#ui_pointBgImageBlur');
					const versionSpan = settingsMenu.querySelector('.sbgcui_settings-version');
					const vibrationDetails = settingsMenu.querySelector('#vibration_notifications').closest('details');

					var markersSelects = [innerMarkerSelect, outerMarkerSelect, outerBottomMarkerSelect, outerTopMarkerSelect];

					minFreeSpaceSpan.innerText = MIN_FREE_SPACE;
					versionSpan.innerText = `v${USERSCRIPT_VERSION}`;
					highlevelMarkersOptions.forEach(option => { option.innerText += ` ${HIGHLEVEL_MARKER}+`; });

					if (!('vibrate' in window.navigator)) { vibrationDetails.classList.add('sbgcui_hidden'); }

					brandingInput.addEventListener('change', onBrandingInputChange);
					brandingInput.addEventListener('input', onBrandingInputInput);
					brandingSelect.addEventListener('change', onBrandingSelectChange);
					closeButton.addEventListener('click', onCloseButtonClick);
					forceClearButton.addEventListener('click', onForceClearButtonClick);
					mapTintingInput.addEventListener('change', onMapTintingInputChange);
					notificationsDurationInput.addEventListener('input', onNotificationsDurationInputInput);
					notificationsIntervalInput.addEventListener('input', onNotificationsIntervalInputInput);
					pointBgImageCheckbox.addEventListener('change', onPointBgImageCheckboxChange);
					settingsMenu.addEventListener('click', closeDetails);
					settingsMenu.addEventListener('submit', onFormSubmit);
					colorFiltersInputs.forEach(input => { input.addEventListener('input', onColorFilterInput); });
					markersSelects.forEach(select => { select.addEventListener('change', onMarkerSelectChange); });
					maxAmountInBagInputs.forEach(input => {
						input.addEventListener('focus', onMaxAmountInBagInputFocus);
						input.addEventListener('change', onMaxAmountInBagInputChange);
						input.addEventListener('input', onMaxAmountInBagInputInput);
					});

					setStoredInputsValues();
					tlContainer.appendChild(settingsMenu);
				}
				catch (error) {
					console.log('SBG CUI: Ошибка при создании меню настроек.', error);
				}

				const toolbarButton = document.createElement('button');
				toolbarButton.classList.add('fa', 'fa-solid-gears');
				toolbarButton.addEventListener('click', onToolbarButtonClick);
				toolbar.addItem(toolbarButton, 1);
			}


			/* Тонирование интерфейса */
			{
				var theme = document.createElement('meta');

				theme.name = 'theme-color';
				document.head.appendChild(theme);

				let tinting = config.tinting;

				if (+tinting.map) { addTinting('map'); }

				profilePopup.addEventListener('profilePopupOpened', _ => {
					if (+tinting.profile) {
						addTinting('profile');
					} else {
						addTinting('');
					}
				});

				pointPopup.addEventListener('pointPopupOpened', _ => {
					if (tinting.point != 'off') {
						addTinting(`point_${tinting.point}`);
					} else {
						addTinting('');
					}
				});

				pointLevelSpan.addEventListener('pointLevelChanged', _ => {
					if (tinting.point == 'level') { addTinting('point_level'); }
				});

				pointOwnerSpan.addEventListener('pointOwnerChanged', _ => {
					if (tinting.point == 'team') { addTinting('point_team'); }
				});

				pointPopup.addEventListener('pointPopupClosed', _ => {
					if (isProfilePopupOpened) {
						if (+tinting.profile) { addTinting('profile'); }
					} else {
						if (+tinting.map) { addTinting('map'); } else { addTinting(''); }
					}
					pointPopup.style.borderColor = '';
					pointTitleSpan.style.color = '';
				});

				profilePopup.addEventListener('profilePopupClosed', _ => {
					if (isPointPopupOpened) {
						if (tinting.point != 'off') { addTinting(`point_${tinting.point}`); }
					} else {
						if (+tinting.map) { addTinting('map'); } else { addTinting(''); }
					}
					profilePopup.style.borderColor = '';
				});
			}


			/* Всплывающий опыт */
			{
				var xpContainer = document.createElement('div');
				xpContainer.classList.add('sbgcui_xpdiff-wrapper');
				document.body.appendChild(xpContainer);
			}


			/* Запись статы */
			{
				function recordStats() {
					const playerName = profileNameSpan.innerText;
					const isSelf = playerName == player.name;
					const confirmMsg = `Сохранить ${isSelf ? 'вашу ' : ''}статистику ${isSelf ? '' : 'игрока '}на текущий момент? \nЭто действие перезапишет сохранённую ранее статистику.`;

					if (confirm(confirmMsg)) {
						getPlayerData(null, playerName).then(stats => {
							const timestamp = Date.now();
							const date = new Date(timestamp).toLocaleString();

							database.transaction('stats', 'readwrite').objectStore('stats').put({ ...stats, timestamp });
							timestampSpan.innerText = `Последнее сохранение: \n${date}`;
						});
					}
				}

				function compareStats() {
					const playerName = profileNameSpan.innerText;
					const isSelf = playerName == player.name;
					const request = database.transaction('stats', 'readonly').objectStore('stats').get(playerName);

					request.addEventListener('success', event => {
						const previousStats = event.target.result;

						if (previousStats == undefined) {
							const message = `Вы ещё не сохраняли ${isSelf ? 'свою ' : ''}статистику${isSelf ? '' : ' этого игрока'}.`;
							const toast = createToast(message, undefined, undefined, 'error-toast');
							toast.showToast();

							return;
						}

						getPlayerData(null, playerName).then(currentStats => {
							let ms = Date.now() - previousStats.timestamp;
							let dhms1 = [86400000, 3600000, 60000, 1000];
							let dhms2 = ['day', 'hr', 'min', 'sec'];
							let since = '';
							let diffs = '';

							dhms1.forEach((e, i) => {
								let amount = Math.trunc(ms / e);

								if (!amount) { return; }

								since += `${since.length ? ', ' : ''}${amount} ${dhms2[i] + (amount > 1 ? 's' : '')}`;
								ms -= amount * e;
							});

							for (let key in currentStats) {
								let diff = currentStats[key] - previousStats[key];

								if (diff) {
									let isPositive = diff > 0;
									let statName;

									switch (key) {
										case 'max_region':
										case 'regions_area':
											statName = i18next.t(`profile.stats.${key}`);
											diff = /*diff < 1 ? i18next.t('units.sqm', { count: diff * 1e6 }) : */i18next.t('units.sqkm', { count: diff });
											break;
										case 'xp':
											statName = i18next.t(`profile.stats.total-xp`);
											break;
										case 'level':
											statName = i18next.t('profile.level');
											break;
										default:
											statName = i18next.t(`profile.stats.${key}`);
									}

									if (statName) {
										diffs += `
									<p class="sbgcui_compare_stats-diff-wrp">
										<span>${statName}:</span>
										<span class="sbgcui_compare_stats-diff-value${isPositive ? 'Pos' : 'Neg'}">
											${isPositive ? '+' : ''}${diff}
										</span>
									</p>
								`;
									}
								}
							}

							let toastText = diffs.length ?
								`${isSelf ? 'Ваша с' : 'С'}татистика ${isSelf ? '' : 'игрока '}с ${new Date(previousStats.timestamp).toLocaleString()}<br>(${since})<br>${diffs}` :
								'Ничего не изменилось с прошлого сохранения.';
							let toast = createToast(toastText, 'bottom center', -1, 'sbgcui_compare_stats-toast');

							toast.showToast();
							toast.toastElement.style.setProperty('--sbgcui-toast-color', `var(--team-${currentStats.team})`);
						});
					});
				}

				function updateTimestamp() {
					const playerName = profileNameSpan.innerText;
					const request = database.transaction('stats', 'readonly').objectStore('stats').get(playerName);

					request.addEventListener('success', event => {
						const previousStats = event.target.result;

						if (previousStats != undefined) {
							const date = new Date(previousStats.timestamp).toLocaleString();
							timestampSpan.innerText = `Последнее сохранение: \n${date}`;
						} else {
							timestampSpan.innerText = '';
						}
					});
				}

				let compareStatsWrp = document.createElement('div');
				let recordButton = document.createElement('button');
				let compareButton = document.createElement('button');
				let timestampSpan = document.createElement('span');
				let prStatsDiv = document.querySelector('.pr-stats');

				recordButton.innerText = 'Записать';
				compareButton.innerText = 'Сравнить';

				timestampSpan.classList.add('sbgcui_compare_stats-timestamp');

				compareStatsWrp.classList.add('sbgcui_compare_stats');
				compareStatsWrp.append(timestampSpan, recordButton, compareButton);

				//profilePopup.insertBefore(compareStatsWrp, prStatsDiv);
                prStatsDiv.before(compareStatsWrp);

				recordButton.addEventListener('click', recordStats);
				compareButton.addEventListener('click', compareStats);
				profilePopup.addEventListener('profilePopupOpened', updateTimestamp);
			}


			/* Кнопка обновления страницы */
			{
				if (window.navigator.userAgent.toLowerCase().includes('wv')) {
					let gameMenu = document.querySelector('.game-menu');
					let reloadButton = document.createElement('button');

					reloadButton.classList.add('fa', 'fa-solid-rotate');
					reloadButton.addEventListener('click', _ => { window.location.reload(); });
					gameMenu.appendChild(reloadButton);
				}
			}


			/* Показ гуида точки */
			{
				pointImage.addEventListener('click', _ => {
					if (pointImage.hasAttribute('sbgcui_clicks')) {
						let clicks = +pointImage.getAttribute('sbgcui_clicks');

						if (clicks + 1 == 5) {
							let iStat = document.querySelector('.i-stat');
							let guid = pointPopup.dataset.guid;
							let guidSpan = document.createElement('span');

							guidSpan.innerText = `GUID: ${guid}`;

							guidSpan.addEventListener('click', _ => {
								window.navigator.clipboard.writeText(`${window.location.origin + window.location.pathname}?point=${guid}`).then(_ => {
									let toast = createToast('Ссылка на точку скопирована в буфер обмена.');
									toast.showToast();
								});
							});

							pointPopup.insertBefore(guidSpan, iStat);

							pointPopup.addEventListener('pointPopupClosed', _ => {
								guidSpan.remove();
								pointImage.setAttribute('sbgcui_clicks', 0);
							});
						}

						pointImage.setAttribute('sbgcui_clicks', clicks + 1);
					} else {
						pointImage.setAttribute('sbgcui_clicks', 1);
					}
				});
			}


			/* Вибрация */
			{
				if ('vibrate' in window.navigator) {
					document.body.addEventListener('click', event => {
						if (config.vibration.buttons && event.target.nodeName == 'BUTTON') {
							window.navigator.vibrate(0);
							window.navigator.vibrate(50);
						}
					});
				}
			}


			/* Избранные точки */
			{
				for (let guid in favorites) {
					favorites[guid] = new Favorite(guid, favorites[guid].cooldown);
				}
				Object.defineProperty(favorites, 'save', {
					value: function () {
						const favoritesStore = database.transaction('favorites', 'readwrite').objectStore('favorites');

						for (let guid in this) {
							if (this[guid].isActive) {
								const cooldown = this[guid].cooldown > Date.now() ? this[guid].cooldown : null;
								favoritesStore.put({ guid, cooldown });
							} else {
								favoritesStore.delete(guid);
							}
						}
					},
				});


				/* Звезда на карточке точки */
				{
					let star = document.createElement('button');
					let guid = pointPopup.dataset.guid;

					star.classList.add('sbgcui_button_reset', 'sbgcui_point_star', 'fa', `fa-${favorites[guid]?.isActive ? 'solid' : 'regular'}-star`);

					star.addEventListener('click', _ => {
						let guid = pointPopup.dataset.guid;
						let name = pointTitleSpan.innerText;

						if (star.classList.contains('fa-solid-star')) {
							favorites[guid].isActive = 0;
							star.classList.replace('fa-solid-star', 'fa-regular-star');
						} else {
							if (guid in favorites) {
								favorites[guid].isActive = 1;
							} else {
								let cooldowns = JSON.parse(localStorage.getItem('cooldowns')) || {};
								let cooldown = (cooldowns[guid]?.c == 0) ? cooldowns[guid].t : null;

								favorites[guid] = new Favorite(guid, cooldown, name);
							}

							star.classList.replace('fa-regular-star', 'fa-solid-star');

							if (!isMobile() && 'Notification' in window && Notification.permission == 'default') {
								Notification.requestPermission();
							}
						}

						favorites.save();
					});

					pointPopup.addEventListener('pointPopupOpened', _ => {
						let guid = pointPopup.dataset.guid;

						if (favorites[guid]?.isActive) {
							star.classList.replace('fa-regular-star', 'fa-solid-star');
						} else {
							star.classList.replace('fa-solid-star', 'fa-regular-star');
						}
					});

					pointImageBox.appendChild(star);
				}


				/* Список избранных */
				{
					let star = document.createElement('button');
					let favsList = document.createElement('div');
					let favsListHeader = document.createElement('header');
					let favsListHeaderTitle = document.createElement('h3');
					let favsListHeaderSubtitle = document.createElement('h6');
					let favsListContent = document.createElement('ul');


					function fillFavsList() {
						if (Object.keys(favorites).length == 0) { return; }

						let favs = [];
						// Из объекта с избранным удаляются неактивные записи (убрана звёздочка), значения сортируются по алфавиту, все данные кроме гуидов удаляются.
						// Результат - массив гуидов, отсортированный по названиям соответствующих им точек.
						// В конце функции список будет снова отсортирован (после того, как будут запрошены данные о каждой точке) по оставшимся дискаверам/кулдауну.
						// Конечный результат - алфавитный список, в котором наверху находятся точки с активным кулдауном.
						const activeFavoritesGuidsByName =
							Object.entries(favorites)
								.filter(entry => entry[1].isActive)
								.sort((a, b) => a[1].name.localeCompare(b[1].name))
								.map(entry => entry[0]);

						favsListContent.innerHTML = '';

						activeFavoritesGuidsByName.forEach(guid => {
							let li = document.createElement('li');
							let pointLink = document.createElement('span');
							let pointName = document.createElement('span');
							let deleteButton = document.createElement('button');
							let pointData = document.createElement('div');

							pointName.innerText = favorites[guid].name;
							pointLink.appendChild(pointName);
							pointLink.addEventListener('click', () => { window.showInfo(guid); });

							deleteButton.classList.add('sbgcui_button_reset', 'sbgcui_favs-li-delete', 'fa', 'fa-solid-circle-xmark');
							deleteButton.addEventListener('click', _ => {
								favorites[guid].isActive = 0;
								favorites.save();
								li.removeAttribute('sbgcui_active', '');
								li.classList.add('sbgcui_hidden');
							});

							pointData.classList.add('sbgcui_favs-li-data');

							li.classList.add('sbgcui_favs-li');
							li.setAttribute('sbgcui_active', '');

							let hasActiveCooldown = favorites[guid].isActive && favorites[guid].cooldown;
							let discoveriesLeft = favorites[guid].discoveriesLeft;

							if (hasActiveCooldown) {
								pointLink.setAttribute('sbgcui_cooldown', favorites[guid].timer);
								pointLink.sbgcuiCooldown = favorites[guid].cooldown;

								let intervalID = setInterval(() => {
									if (isFavsListOpened && favorites[guid].isActive && favorites[guid].cooldown) {
										pointLink.setAttribute('sbgcui_cooldown', favorites[guid].timer);
									} else {
										clearInterval(intervalID);
									}
								}, 1000);
							} else if (discoveriesLeft) {
								pointLink.setAttribute('sbgcui_discoveries', discoveriesLeft);
								pointLink.discoveriesLeft = discoveriesLeft;
							}

							li.append(deleteButton, pointLink, pointData);
							favs.push(li);

							getPointData(guid)
								.then(data => {
									if (!data) { return; }

									const { co: cores, g: guid, l: level, li: lines, t: title, te: team } = data;
									const energy = Math.round(data.e);
									const inventoryCache = JSON.parse(localStorage.getItem('inventory-cache'));
									const isAllied = team == player.team;
									const refs = inventoryCache.find(item => item.l == guid)?.a ?? 0;

									pointName.innerText = `[${level}] ${title}`;
									pointLink.style.color = isAllied ? 'var(--sbgcui-branding-color)' : `var(--team-${team})`;
									pointData.innerHTML = `${energy}% @ ${cores}<br>${lines.i}↓ ${lines.o}↑ / ${i18next.t('sbgcui.refsShort')}: ${refs}`;
								});
						});

						favs.sort((a, b) => {
							a = a.childNodes[1].sbgcuiCooldown || a.childNodes[1].discoveriesLeft;
							b = b.childNodes[1].sbgcuiCooldown || b.childNodes[1].discoveriesLeft;

							return (a == undefined) ? 1 : (b == undefined) ? -1 : (a - b);
						});
						favsListContent.append(...favs);
					}


					favsList.classList.add('sbgcui_favs', 'sbgcui_hidden');
					favsListHeader.classList.add('sbgcui_favs-header');
					favsListHeaderTitle.classList.add('sbgcui_favs-header-title');
					favsListHeaderSubtitle.classList.add('sbgcui_favs-header-subtitle');
					favsListContent.classList.add('sbgcui_favs-content');

					favsListHeaderTitle.innerText = 'Избранные точки';
					favsListHeaderSubtitle.innerText = 'Быстрый доступ к важным точкам, уведомления об их остывании и защита от автоудаления сносок.';

					favsListHeader.append(favsListHeaderTitle, favsListHeaderSubtitle);
					favsList.append(favsListHeader, favsListContent);

					star.classList.add('fa', 'fa-solid-star', 'sbgcui_favs_star');
					star.addEventListener('click', () => {
						fillFavsList();
						favsList.classList.toggle('sbgcui_hidden');
						isFavsListOpened = !isFavsListOpened;
					});

					document.body.addEventListener('click', event => {
						if (
							isFavsListOpened &&
							!event.target.closest('.info.popup') &&
							!event.target.closest('.sbgcui_favs') &&
							!event.target.closest('.sbgcui_favs_star')
						) {
							favsList.classList.add('sbgcui_hidden');
							isFavsListOpened = false;
						}
					});

					toolbar.addItem(star, 2);
					document.body.appendChild(favsList);
				}
			}


			/* Ссылка на точку из списка ключей */
			{
				inventoryContent.addEventListener('click', event => {
					if (!event.target.classList.contains('inventory__ic-view')) { return; }

					let guid = event.target.closest('.inventory__item').dataset.ref;

					if (!guid) { return; }
					if (confirm('Открыть карточку точки? Либо нажмите "Отмена" для перехода к месту на карте.')) { window.showInfo(guid); }
				});
			}


			/* Дискавер без рефа или предметов */
// 			{
// 				let noLootSpan = document.createElement('span');
// 				let noRefsSpan = document.createElement('span');

// 				noLootSpan.classList.add('sbgcui_no_loot', 'fa', 'fa-solid-droplet-slash');
// 				noRefsSpan.classList.add('sbgcui_no_refs', 'fa', 'fa-solid-link-slash');

// 				discoverButton.append(noLootSpan, noRefsSpan);

// 				discoverButton.addEventListener('click', event => {
// 					if (event.target == discoverButton) {
// 						discoverModifier = new DiscoverModifier(1, 1);
// 					} else {
// 						let isLoot = !event.target.classList.contains('sbgcui_no_loot');
// 						let isRefs = !event.target.classList.contains('sbgcui_no_refs');

// 						discoverModifier = new DiscoverModifier(isLoot, isRefs);
// 					}
// 				});
// 			}


			/* Сортировка рефов */
			{
				function compare(a, b) {
					const aData = pointsData[a.dataset.ref];
					const bData = pointsData[b.dataset.ref];

					switch (sortParam) {
						case 'title':
							return aData.title.localeCompare(bData.title);
						case 'level':
							return aData.l - bData.l;
						case 'team':
							if (aData.te == bData.te) {
								return aData.title.localeCompare(bData.title);
							} else {
								return (aData.te == player.team) ? -1 : (bData.te == player.team) ? 1 : aData.te - bData.te;
							}
						case 'energy':
							if (aData.te == bData.te) {
								return (aData.e == bData.e) ? aData.title.localeCompare(bData.title) : aData.e - bData.e;
							} else {
								return (aData.te == player.team) ? -1 : (bData.te == player.team) ? 1 : (aData.te == bData.te) ? aData.title.localeCompare(bData.title) : aData.e - bData.e;
							}
						case 'distance':
							return aData.distance - bData.distance;
						case 'amount':
							return aData.amount - bData.amount;
						case 'guard':
							return bData.gu - aData.gu;
					}
				}

				function onDataFetchingAbort() {
					select.removeAttribute('disabled');
					inventoryContent.classList.remove('sbgcui_refs_list-blur');
				}

				function onCloseButtonClick() {
					abortController.abort();
					select.value = 'none';
					select.removeAttribute('disabled');
					inventoryContent.classList.remove('sbgcui_refs_list-blur');
					invCloseButton.style.removeProperty('--sbgcui-progress');

					inventory = [];
					pointsData = {};
					isCompleteData = false;
				}

				function onInventoryPopupOpened() {
					inventory = JSON.parse(localStorage.getItem('inventory-cache'));
					inventory.forEach(item => {
						if (item.t == 3) {
							pointsData[item.l] = { amount: item.a, title: item.ti, c: item.c, };
						}
					});
				}

				function onPointRepaired(event) {
					const { guid, energy } = event.detail;
					if (guid in pointsData) { pointsData[guid].e = energy; }
				}

				async function onSelectChange(event) {
					const refsElements = [...inventoryContent.children];
					
					sortParam = event.target.value;

					switch (sortParam) {
						case 'none':
							return;
						case 'distance':
							for (let guid in pointsData) { pointsData[guid].distance = getDistance(pointsData[guid].c); }
							break;
						case 'level':
						case 'team':
						case 'energy':
						case 'guard':
							if (isCompleteData) { break; }

							abortController = new AbortController();
							abortController.signal.addEventListener('abort', onDataFetchingAbort);

							select.setAttribute('disabled', '');
							inventoryContent.classList.add('sbgcui_refs_list-blur');

							try {
								const guids = Object.keys(pointsData);
								const responseData = await getMultiplePointsData(guids, abortController.signal, invCloseButton);

								if (abortController.signal.aborted) { return; }

								isCompleteData = true;
								responseData.forEach(point => { Object.assign(pointsData[point.g], point); });
							} catch (error) {
								select.value = 'none';
								showToast(`Ошибка при получении данных точки. <br>${error.message}`, undefined, undefined, 'error-toast');
								console.log('SBG CUI: Ошибка при получении данных точки.', error);
							} finally {
								invCloseButton.style.removeProperty('--sbgcui-progress');
							}

							break;
					}

					if (isCompleteData) { refsElements.forEach(element => { window.makeEntry(element, pointsData[element.dataset.ref]); }); }

					refsElements.sort(compare);
					inventoryContent.replaceChildren(...refsElements);
					select.removeAttribute('disabled');
					inventoryContent.scrollTop = isReverseOrder ? -inventoryContent.scrollHeight : 0;
					inventoryContent.classList.remove('sbgcui_refs_list-blur');
					
					// Когда сортируем по параметрам, не требующим запроса данных точек (название, кол-во, расстояние),
					// надо заставить основной код подгрузить инфу о точках самостоятельно, дёрнув страницу.
					const scrollEvent = new Event('scroll');
					Object.defineProperty(scrollEvent, 'target', { value: { scrollTop: -1, clientHeight: inventoryContent.clientHeight } });
					inventoryContent.dispatchEvent(scrollEvent);
				}

				function onSortOrderButtonClick() {
					isReverseOrder = !isReverseOrder;
					if (isReverseOrder) {
						inventoryContent.classList.add('sbgcui_refs-reverse');
						sortOrderButton.classList.replace('fa-solid-arrow-down-a-z', 'fa-solid-arrow-down-z-a');
						inventoryContent.scrollTop = -inventoryContent.scrollHeight;
					} else {
						inventoryContent.classList.remove('sbgcui_refs-reverse');
						sortOrderButton.classList.replace('fa-solid-arrow-down-z-a', 'fa-solid-arrow-down-a-z');
						inventoryContent.scrollTop = 0;
					}
				}

				function onTabClick() {
					abortController.abort();
					select.value = 'none';
					select.removeAttribute('disabled');
					inventoryContent.classList.remove('sbgcui_refs_list-blur');
					invCloseButton.style.removeProperty('--sbgcui-progress');
				}

				const invControls = document.querySelector('.inventory__controls');
				const invDelete = document.querySelector('#inventory-delete');
				const invTabs = document.querySelector('.inventory__tabs');
				const select = document.createElement('select');
				const sortOrderButton = document.createElement('button');
				let abortController = new AbortController();
				let sortParam = 'none';
				let inventory = [];
				let pointsData = {};
				let isReverseOrder = false;
				let isCompleteData = false; // true: при сбросе сортировки (нажатие на вкладку) данные о точках не запрашиваются повторно, а берутся из памяти.

				sortOrderButton.classList.add('fa', 'fa-solid-arrow-down-a-z', 'sbgcui_refs-sort-button');
				select.classList.add('sbgcui_refs-sort-select');

				[
					[i18next.t('sbgcui.sort-none'), 'none'],
					[i18next.t('sbgcui.sort-title'), 'title'],
					[i18next.t('sbgcui.sort-level'), 'level'],
					[i18next.t('sbgcui.sort-team'), 'team'],
					[i18next.t('sbgcui.sort-energy'), 'energy'],
					[i18next.t('sbgcui.sort-distance'), 'distance'],
					[i18next.t('sbgcui.sort-amount'), 'amount'],
					[i18next.t('sbgcui.sort-guard'), 'guard'],
				].forEach(e => {
					const option = document.createElement('option');

					option.innerText = e[0];
					option.value = e[1];

					select.appendChild(option);
				});

				select.addEventListener('change', onSelectChange);
				invTabs.addEventListener('click', onTabClick);
				invCloseButton.addEventListener('click', onCloseButtonClick);
				sortOrderButton.addEventListener('click', onSortOrderButtonClick);
				inventoryPopup.addEventListener('inventoryPopupOpened', onInventoryPopupOpened);
				inventoryContent.addEventListener('pointRepaired', onPointRepaired);

				invControls.insertBefore(select, invDelete);
				invControls.appendChild(sortOrderButton);
			}


			/* Подсветка точек */
			{
				class PointFeature extends ol.Feature {
					constructor(arg) {
						super(arg);

						this.addEventListener('change', () => {
							if (!this.id_ || !this.style_) { return; }

							let { inner, outer, outerTop, outerBottom, text } = config.pointHighlighting;
							let style = this.style_;

							this.addStyle(style, 'inner', 1, this.isMarkerNeeded(inner));
							this.addStyle(style, 'outer', 2, this.isMarkerNeeded(outer));
							this.addStyle(style, 'outerTop', 3, this.isMarkerNeeded(outerTop));
							this.addStyle(style, 'outerBottom', 4, this.isMarkerNeeded(outerBottom));
							this.addStyle(style, null, 5, false, this.textToRender(text));
						});
					}

					isMarkerNeeded(marker) {
						switch (marker) {
							case 'fav': return this.id_ in favorites;
							case 'ref': return this.cachedRefsGuids.includes(this.id_);
							case 'uniqc': return uniques.c.has(this.id_);
							case 'uniqv': return uniques.v.has(this.id_);
							case 'cores': return inview[this.id_]?.cores == 6;
							case 'highlevel': return inview[this.id_]?.level >= HIGHLEVEL_MARKER;
							default: return false;
						}
					}

					textToRender(type) {
						switch (type) {
							case 'energy':
								let energy = inview[this.id_]?.energy;
								return energy > 0 ? String(Math.round(energy * 10) / 10) : null;
							case 'level':
								let level = inview[this.id_]?.level;
								return typeof level == 'number' ? String(level) : null;
							case 'lines':
								let lines = inview[this.id_]?.linesAmount;
								return lines > 0 ? String(lines) : null;
							case 'refsAmount':
								let amount = this.cachedRefsAmounts[this.id_];
								return amount > 0 ? String(amount) : null;
							default: return null;
						}
					}

					addStyle(style, type, index, isMarkerNeeded, text) {
						// style[0] – стиль, который вешает игра.
						// style[1] – стиль внутреннего маркера: точка.
						// style[2] – стиль внешнего маркера: кольцо.
						// style[3] – стиль внешнего маркера: верхнее полукольцо.
						// style[4] – стиль внешнего маркера: нижнее полукольцо.
						// style[5] – стиль текстового маркера.

						if (isMarkerNeeded == true) {
							style[index] = style[0].clone();
							style[index].renderer_ = this[`${type}MarkerRenderer`];
						} else {
							style[index] = new ol.style.Style({});
							style[index].text_ = text ? new ol.style.Text({
								font: '14px Manrope',
								offsetY: style[1].renderer_ ? -20 : 0,
								text,
								fill: new ol.style.Fill({ color: '#000' }),
								stroke: new ol.style.Stroke({ color: '#FFF', width: 3 }),
							}) : undefined;
						}
					}

					innerMarkerRenderer(coords, state) {
						const ctx = state.context;
						const [[xc, yc], [xe, ye]] = coords;
						const radius = Math.sqrt((xe - xc) ** 2 + (ye - yc) ** 2) / 3;

						ctx.fillStyle = config.pointHighlighting.innerColor;
						ctx.beginPath();
						ctx.arc(xc, yc, radius, 0, 2 * Math.PI);
						ctx.fill();
					}

					outerMarkerRenderer(coords, state) {
						const ctx = state.context;
						const [[xc, yc], [xe, ye]] = coords;
						const radius = Math.sqrt((xe - xc) ** 2 + (ye - yc) ** 2) * 1.3;

						ctx.lineWidth = 4;
						ctx.strokeStyle = config.pointHighlighting.outerColor;
						ctx.beginPath();
						ctx.arc(xc, yc, radius, 0, 2 * Math.PI);
						ctx.stroke();
					}

					outerTopMarkerRenderer(coords, state) {
						const ctx = state.context;
						const [[xc, yc], [xe, ye]] = coords;
						const radius = Math.sqrt((xe - xc) ** 2 + (ye - yc) ** 2) * 1.3;

						ctx.lineWidth = 4;
						ctx.strokeStyle = config.pointHighlighting.outerTopColor;
						ctx.beginPath();
						ctx.arc(xc, yc, radius, 195 * (Math.PI / 180), 345 * (Math.PI / 180));
						ctx.stroke();
					}

					outerBottomMarkerRenderer(coords, state) {
						const ctx = state.context;
						const [[xc, yc], [xe, ye]] = coords;
						const radius = Math.sqrt((xe - xc) ** 2 + (ye - yc) ** 2) * 1.3;

						ctx.lineWidth = 4;
						ctx.strokeStyle = config.pointHighlighting.outerBottomColor;
						ctx.beginPath();
						ctx.arc(xc, yc, radius, 15 * (Math.PI / 180), 165 * (Math.PI / 180));
						ctx.stroke();
					}

					get cachedRefsGuids() {
						return JSON.parse(localStorage.getItem('inventory-cache')).filter(e => e.t == 3).map(e => e.l);
					}

					get cachedRefsAmounts() {
						return Object.fromEntries(JSON.parse(localStorage.getItem('inventory-cache')).filter(e => e.t == 3).map(e => [e.l, e.a]));
					}
				}

				ol.PointFeature = PointFeature;
			}


			/* Показ радиуса катализатора */
			{
				function drawBlastRange() {
					const activeSlide = [...catalysersList.children].find(e => e.classList.contains('is-active'));
					const cache = JSON.parse(localStorage.getItem('inventory-cache')) || [];
					const item = cache.find(e => e.g == activeSlide.dataset.guid);
					const level = item.l;
					const range = item.t == 2 ? window.Catalysers[level].range : item.t == 4 ? PLAYER_RANGE : 0;

					playerFeature.getStyle()[3].getGeometry().setRadius(toOLMeters(range));
					playerFeature.getStyle()[3].getStroke().setColor(`${config.mapFilters.brandingColor}70`);
					playerFeature.changed();

					if (isFollow) { view.fitBlastRange(); }
				}

				function hideBlastRange() {
					const currentZoom = view.getZoom();
					const { beforeAttackZoom, blastRangeZoom } = view.getProperties();
					onCloseZoom = currentZoom == blastRangeZoom ? beforeAttackZoom : currentZoom;

					playerFeature.getStyle()[3].getGeometry().setRadius(0);
					playerFeature.changed();

					if (isFollow) { resetView(); }
				}

				function resetView(isCompleted) {
					if (isCompleted) { return; }
					view.setTopPadding();
					view.animate(
						{
							center: playerFeature.getGeometry().getCoordinates(),
							zoom: onCloseZoom,
							duration: 0, // Временно отключено
						},
						resetView
					);
				}

				function saveCurrentZoom() {
					view.setProperties({
						beforeAttackZoom: view.getZoom(),
						isZoomChanged: false
					});
				}

				function zoomContainerClickHandler(event) {
					const isZoomButtonClicked = event.target.matches('.ol-zoom-in, .ol-zoom-out');
					if (isAttackSliderOpened && isZoomButtonClicked) { view.set('isZoomChanged', true); }
				}

				let onCloseZoom;

				attackSlider.addEventListener('attackSliderOpened', saveCurrentZoom);
				catalysersList.addEventListener('activeSlideChanged', drawBlastRange);
				attackSlider.addEventListener('attackSliderClosed', hideBlastRange);
				zoomContainer.addEventListener('click', zoomContainerClickHandler);
			}


			/* Перезапрос инвью */
			{
				function redraw() {
					view.setCenter([0, 0]);
					setTimeout(() => {
						view.setCenter(playerFeature.getGeometry().getCoordinates());
					}, 1);
				}

				let button = document.createElement('button');

				button.classList.add('fa', 'fa-solid-rotate');

				//button.addEventListener('click', redraw);
				button.addEventListener('click', () => { window.requestEntities(); });

				toolbar.addItem(button, 3);

				//redraw();
			}


			/* Показ скорости */
			{
				const geolocation = new ol.Geolocation({
					projection: view.getProjection(),
					tracking: true,
					trackingOptions: { enableHighAccuracy: true },
				});
				const speedSpan = document.createElement('span');

				speedSpan.classList.add('sbgcui_speed');
				document.querySelector('.self-info').appendChild(speedSpan);

				geolocation.on('change:speed', () => {
					const speed_mps = geolocation.getSpeed() || 0;
					speedSpan.innerText = (speed_mps * 3.6).toFixed(2) + ' km/h';
				});
			}


			/* Выбор точки из кластера */
			{
				const closeButton = document.createElement('button');
				const cooldownGradient = `conic-gradient(
					#0000 var(--sbgcui-cluster-cooldown, 100%),
					var(--sbgcui-cluster-team, #000) var(--sbgcui-cluster-cooldown, 100%) calc(var(--sbgcui-cluster-cooldown, 100%) + 1%),
					#0007 var(--sbgcui-cluster-cooldown, 100%) 100%
					)`;
				const origin = document.createElement('div');
				const overlay = document.createElement('div');
				const originalOnClick = map.getListeners('click')[0];
				const overlayTransitionsTime = 200;
				let featuresAtPixel;
				let lastShownCluster = [];
				let mapClickEvent;
				let cooldownProgressBarIntervals = [];

				function featureClickHandler(event) {
					if (!isClusterOverlayOpened) { return; }

					const chosenFeatureGuid = event.target.getAttribute('sbgcui_guid');
					const chosenFeature = featuresAtPixel.find(feature => feature.getId() == chosenFeatureGuid);

					// ЗАМЕНЕНО НА window.showInfo
					//chosenFeature.set('sbgcui_chosenFeature', true, true);

					hideOverlay();
					setTimeout(() => {
						/* ЗАМЕНЕНО НА window.showInfo
						mapClickEvent.pixel = map.getPixelFromCoordinate(chosenFeature.getGeometry().getCoordinates());
						originalOnClick(mapClickEvent);
						*/
						window.showInfo(chosenFeature.getId());
						highlightFeature(chosenFeature, undefined, { once: true });
					}, overlayTransitionsTime);
				}

				function hideOverlay() {
					origin.childNodes.forEach(node => { node.classList.remove('sbgcui_cluster-iconWrapper-fullWidth'); });
					overlay.classList.remove('sbgcui_cluster-overlay-blur');
					setTimeout(() => {
						overlay.classList.add('sbgcui_hidden');
						cooldownProgressBarIntervals.forEach(intervalID => { clearInterval(intervalID); });
						isClusterOverlayOpened = false;
					}, overlayTransitionsTime);
				}

				function mapClickHandler(event) {
					mapClickEvent = event;
					featuresAtPixel = map.getFeaturesAtPixel(mapClickEvent.pixel, {
						hitTolerance: HIT_TOLERANCE,
						layerFilter: layer => layer.get('name') == 'points',
					});
					let featuresToDisplay = featuresAtPixel.slice();

					if (featuresToDisplay.length <= 1 || mapClickEvent.isSilent) { // isSilent: такой эвент генерируется при свайпе между карточками точек.
						const feature = featuresToDisplay[0];

						if (feature != undefined) {
							feature.set('sbgcui_chosenFeature', true, true);
							highlightFeature(feature, undefined, { once: true });
						}

						originalOnClick(mapClickEvent);
					} else {
						sortFeaturesByAngle(featuresToDisplay);
						if (featuresToDisplay.length > MAX_DISPLAYED_CLUSTER) { // Показываем ограниченное кол-во, чтобы выглядело аккуратно.
							featuresToDisplay = featuresToDisplay.reduceRight(reduceFeatures, []); // Не выводим показанные в прошлый раз точки если их больше ограничения.
						}

						spreadFeatures(featuresToDisplay);
						showOverlay();
						lastShownCluster = featuresToDisplay;
					}
				}

				function reduceFeatures(acc, feature, index) {
					const isExtraFeatures = MAX_DISPLAYED_CLUSTER - acc.length <= index;
					const isFreeSlots = acc.length < MAX_DISPLAYED_CLUSTER;
					const isShownLastTime = lastShownCluster.includes(feature);

					if (!isFreeSlots) { return acc; }

					if (isShownLastTime) {
						if (!isExtraFeatures) { acc.push(feature); }
					} else {
						acc.push(feature);
					}

					return acc;
				}

				function showOverlay() {
					overlay.classList.remove('sbgcui_hidden');
					setTimeout(() => {
						overlay.classList.add('sbgcui_cluster-overlay-blur');
						isClusterOverlayOpened = true;
					}, 10);
					cooldownProgressBarIntervals = [];
				}

				function sortFeaturesByAngle(features) {
					function angleComparator(a, b) {
						const aCoords = a.getGeometry().getCoordinates();
						const bCoords = b.getGeometry().getCoordinates();
						let aAngle = Math.atan2((aCoords[1] - center[1]), (aCoords[0] - center[0]));
						let bAngle = Math.atan2((bCoords[1] - center[1]), (bCoords[0] - center[0]));

						if (aAngle < 0) { aAngle += 2 * Math.PI; }
						if (bAngle < 0) { bAngle += 2 * Math.PI; }

						// Math.PI * 2.5 - это целый круг + сектор 90 гр., т.к. точки в ромашке выводятся по часовой стрелке начиная с 12 часов.
						aAngle = (Math.PI * 2.5 - aAngle) % (Math.PI * 2);
						bAngle = (Math.PI * 2.5 - bAngle) % (Math.PI * 2);

						return aAngle - bAngle;
					}

					const featuresCoords = features.map(f => f.getGeometry().getCoordinates());
					const avgX = featuresCoords.reduce((acc, coords) => acc + coords[0], 0) / featuresCoords.length;
					const avgY = featuresCoords.reduce((acc, coords) => acc + coords[1], 0) / featuresCoords.length;
					const center = [avgX, avgY];

					features.sort(angleComparator);
				}

				function spreadFeatures(features) {
					const angle = 360 / features.length;

					origin.innerHTML = '';

					features.forEach((feature, index) => {
						const guid = feature.getId();
						const icon = document.createElement('div');
						const line = document.createElement('div');
						const wrapper = document.createElement('div');

						const cooldownTimestamp = JSON.parse(localStorage.getItem('cooldowns'))?.[guid]?.t;
						if (cooldownTimestamp) {
							updateCooldown(icon, cooldownTimestamp)
							const intervalID = setInterval(() => { updateCooldown(icon, cooldownTimestamp, intervalID); }, 1000);
							cooldownProgressBarIntervals.push(intervalID);
							icon.style.backgroundImage = cooldownGradient;
						}

						getPointData(guid, false)
							.then(data => {
								const bgImage = `url("https://lh3.googleusercontent.com/${data.i}=s60")`;
								icon.style.backgroundImage += icon.style.backgroundImage.length ? ', ' : '';
								icon.style.backgroundImage += bgImage;
								icon.style.borderColor = `var(--team-${data.te || 0})`;
								icon.style.boxShadow = `0 0 20px 3px var(--team-${data.te || 0}), 0 0 5px 2px black`;
								icon.style.setProperty('--sbgcui-point-title', `"${data.t.replaceAll('"', '\\22 ')}"`);
								icon.style.setProperty('--sbgcui-point-level', `"${data.l}"`);
								icon.style.setProperty('--sbgcui-cluster-team', `var(--team-${data.te})`);
							});

						wrapper.classList.add('sbgcui_cluster-iconWrapper');
						icon.classList.add('sbgcui_cluster-icon');
						line.classList.add('sbgcui_cluster-line');

						wrapper.style.transform = `rotate(${angle * index}deg)`;
						icon.style.transform = `rotate(${-angle * index}deg)`;

						wrapper.append(icon, line);
						origin.appendChild(wrapper);

						setTimeout(() => { wrapper.classList.add('sbgcui_cluster-iconWrapper-fullWidth'); }, 10);

						icon.setAttribute('sbgcui_guid', guid);

						icon.addEventListener('click', featureClickHandler);
					});
				}

				function updateCooldown(icon, cooldownTimestamp, intervalID) {
					const cooldownSec = (cooldownTimestamp - Date.now()) / 1000;
					const gradientPercentage = Math.trunc(100 - cooldownSec / DISCOVERY_COOLDOWN * 100);

					if (cooldownSec <= DISCOVERY_COOLDOWN && cooldownSec >= 0) {
						icon.style.setProperty('--sbgcui-cluster-cooldown', `${gradientPercentage}%`);
					} else {
						clearInterval(intervalID);
						icon.style.removeProperty('--sbgcui-cluster-cooldown');
					}
				}

				closeButton.classList.add('sbgcui_button_reset', 'sbgcui_cluster-close', 'fa', 'fa-solid-circle-xmark');
				origin.classList.add('sbgcui_cluster-center');
				overlay.classList.add('sbgcui_cluster-overlay', 'sbgcui_hidden');

				overlay.append(origin, closeButton);
				document.body.appendChild(overlay);

				closeButton.addEventListener('click', hideOverlay);

				map.un('click', originalOnClick);
				map.on('click', mapClickHandler);
			}


			/* Режим рисования звезды */
			{
				const starModeButton = document.createElement('button');

				function toggleStarMode() {
					const confirmMessage = `Использовать предыдущую сохранённую точку "${starModeTarget?.name}" в качестве центра звезды?`;
					let toastMessage;

					isStarMode = !isStarMode;
					database.transaction('state', 'readwrite').objectStore('state').put(isStarMode, 'isStarMode');

					if (isStarMode) {
						starModeButton.style.opacity = 1;
						starModeButton.classList.add('fa-fade');

						if (starModeTarget && confirm(confirmMessage)) {
							starModeButton.classList.remove('fa-fade');
							toastMessage = `Включён режим рисования "Звезда". <br /><br />
										Точка "<span style="color: var(--selection)">${starModeTarget.name}</span>" будет считаться центром звезды. <br /><br />
										Сноски от прочих точек будут скрыты в списке рисования.`;
						} else {
							pointPopup.addEventListener('pointPopupOpened', onPointPopupOpened, { once: true });
							toastMessage = `Включён режим рисования "Звезда". <br /><br />
									Следующая открытая точка будет считаться центром звезды. <br /><br />
									Сноски от прочих точек будут скрыты в списке рисования.`;
						}
					} else {
						starModeButton.style.opacity = 0.5;
						starModeButton.classList.remove('fa-fade');

						pointPopup.removeEventListener('pointPopupOpened', onPointPopupOpened);

						toastMessage = 'Режим рисования "Звезда" отключён.';
					}

					const toast = createToast(toastMessage, undefined, isStarMode ? 6000 : undefined, 'sbgcui_toast-selection');
					toast.showToast();
				}

				function onPointPopupOpened() {
					starModeTarget = {
						guid: pointPopup.dataset.guid,
						name: pointTitleSpan.innerText
					};
					database.transaction('state', 'readwrite').objectStore('state').put(starModeTarget, 'starModeTarget');

					starModeButton.classList.remove('fa-fade');

					const message = `Точка "<span style="color: var(--selection)">${pointTitleSpan.innerText}</span>" выбрана центром для рисования звезды.`;
					const toast = createToast(message, undefined, undefined, 'sbgcui_toast-selection');
					toast.showToast();
				}

				starModeButton.classList.add('fa', 'fa-solid-asterisk');
				starModeButton.style.opacity = isStarMode ? 1 : 0.5;
				starModeButton.addEventListener('click', toggleStarMode);

				toolbar.addItem(starModeButton, 4);
			}


			/* Переключение между точками и автооткрытие */
			{
				const arrow = document.createElement('i');
				const shownPoints = new Set();
				let touchMoveCoords = [];

				function hasFreeSlots(point) {
					const guid = point.getId();
					return inview[guid] == undefined || inview[guid].cores < 6;
				}

				function isDiscoverable(point) {
					const guid = point.getId();
					const now = Date.now();
					const cooldown = JSON.parse(localStorage.getItem('cooldowns'))?.[guid];

					return cooldown?.t == undefined || (cooldown.t <= now && cooldown.c > 0);
				}

				function getPointsInRange() {
					const playerCoords = playerFeature.getGeometry().getCoordinates();
					const playerPixel = map.getPixelFromCoordinate(playerCoords);
					const resolution = view.getResolution();
					const hitTolerance = toOLMeters(PLAYER_RANGE) / resolution;

					const pointsHit = map.getFeaturesAtPixel(playerPixel, {
						hitTolerance,
						layerFilter: layer => layer.get('name') == 'points',
					});

					const pointsInRange = pointsHit.filter(point => isPointInRange(point));

					return pointsInRange;
				}

				function keydownHandler(event) {
					event.code == 'KeyN' && showNextPointInRange();
				}

				function pointPopupCloseHandler() {
					window.removeEventListener('playerMove', toggleArrowVisibility);
				}

				function pointPopupOpenHandler() {
					toggleArrowVisibility();
					window.addEventListener('playerMove', toggleArrowVisibility);
				}

				function checkPopupsAndShowPoint() {
					!isAnyOverlayActive() && showNextPointInRange(true);
				}

				function showNextPointInRange(isAutoShow) {
					const pointsInRange = getPointsInRange();
					if (lastOpenedPoint.guid != undefined) { shownPoints.add(lastOpenedPoint.guid); }

					const isEveryPointInRangeShown = pointsInRange.every(point => shownPoints.has(point.getId()));
					const isNoOnePointInRangeShown = pointsInRange.every(point => !shownPoints.has(point.getId()));

					if (isEveryPointInRangeShown) {
						if (isAutoShow) { return; }
						shownPoints.clear();
					} else if (isNoOnePointInRangeShown) {
						shownPoints.clear();
					}

					const suitablePoints = pointsInRange.filter(point => (point.getId() !== lastOpenedPoint.guid) && !shownPoints.has(point.getId()));
					const nextPoint = suitablePoints.find(hasFreeSlots) ?? suitablePoints.find(isDiscoverable) ?? suitablePoints[0];

					if (nextPoint == undefined) { return; }

					shownPoints.add(nextPoint.getId());

					/* ЗАМЕНЕНО НА window.showInfo
					const fakeEvent = {};

					fakeEvent.type = 'click';
					fakeEvent.pixel = map.getPixelFromCoordinate(nextPoint.getGeometry().getCoordinates());
					fakeEvent.originalEvent = {};
					fakeEvent.isSilent = true; // Такой эвент будет проигнорирован функцией показа ромашки для кластера.

					nextPoint.set('sbgcui_chosenFeature', true, true);
					pointPopup.classList.add('hidden');
					map.dispatchEvent(fakeEvent);
					*/
					pointPopup.classList.add('hidden');
					window.showInfo(nextPoint.getId());
					highlightFeature(nextPoint, undefined, { once: true });
				}

				function toggleArrowVisibility() {
					if (getPointsInRange().length > 1) {
						arrow.classList.remove('sbgcui_hidden');
					} else {
						arrow.classList.add('sbgcui_hidden');
					}
				}

				function toggleAutoShowPoints() {
					state.isAutoShowPoints = !state.isAutoShowPoints;
					database.transaction('state', 'readwrite').objectStore('state').put(state.isAutoShowPoints, 'isAutoShowPoints');
					state.isAutoShowPoints ? turnAutoShowPointsOn() : turnAutoShowPointsOff();
					showToast(`${state.isAutoShowPoints ? 'В' : 'От'}ключено открытие точки при приближении к ней.`);
				}

				function touchEndHandler() {
					if (Object.isSealed(touchMoveCoords) || touchMoveCoords.length == 0) { return; }

					const isRtlSwipe = touchMoveCoords.every((coords, i, arr) => coords.x <= arr[i - 1]?.x || i == 0);
					if (!isRtlSwipe) { return; }

					const xCoords = touchMoveCoords.map(coords => coords.x);
					const yCoords = touchMoveCoords.map(coords => coords.y);
					const minX = Math.min(...xCoords);
					const maxX = Math.max(...xCoords);
					const minY = Math.min(...yCoords);
					const maxY = Math.max(...yCoords);

					if (maxY - minY > 70) { return; }
					if (maxX - minX < 50) { return; }

					showNextPointInRange();
				}

				function touchMoveHandler(event) {
					if (Object.isSealed(touchMoveCoords)) { return; }

					const { clientX: x, clientY: y } = event.touches.item(0);

					touchMoveCoords.push({ x, y });
				}

				function touchStartHandler(event) {
					touchMoveCoords = [];
					if (event.touches.length > 1 || event.touches.item(0).target.closest('.deploy-slider-wrp') !== null) {
						Object.seal(touchMoveCoords);
					}
				}

				function turnAutoShowPointsOff() {
					autoShowPointsButton.style.opacity = 0.5;
					autoShowPointsButton.classList.remove('fa-fade');
					window.removeEventListener('playerMove', checkPopupsAndShowPoint);
				}

				function turnAutoShowPointsOn() {
					autoShowPointsButton.style.opacity = 1;
					autoShowPointsButton.classList.add('fa-fade');
					window.addEventListener('playerMove', checkPopupsAndShowPoint);
				}

				arrow.classList.add('sbgcui_swipe-cards-arrow', 'fa', 'fa-solid-angles-left');
				document.querySelector('.i-stat').appendChild(arrow);

				pointPopup.addEventListener('pointPopupOpened', pointPopupOpenHandler);
				pointPopup.addEventListener('pointPopupClosed', pointPopupCloseHandler);

				pointPopup.addEventListener('touchstart', touchStartHandler);
				pointPopup.addEventListener('touchmove', touchMoveHandler);
				pointPopup.addEventListener('touchend', touchEndHandler);

				document.addEventListener('keydown', keydownHandler);

				const autoShowPointsButton = document.createElement('button');

				autoShowPointsButton.classList.add('fa', 'fa-solid-arrows-to-dot');
				autoShowPointsButton.addEventListener('click', toggleAutoShowPoints);
				state.isAutoShowPoints ? turnAutoShowPointsOn() : turnAutoShowPointsOff();

				toolbar.addItem(autoShowPointsButton, 7);
			}


			/* Сравнение статы со своей */
			{
				const bottomButtons = document.querySelector('.pr-buttons');
				const compareButton = document.createElement('button');

				async function toggleValues() {
					const playerStats = await getPlayerData(null, profileNameSpan.innerText);
					const selfStats = await getPlayerData(null, player.name);
					const i18nextStats = i18next.getResourceBundle(i18next.resolvedLanguage ?? 'en').profile.stats;
					const statTitles = document.querySelectorAll('.pr-stat-title');

					compareButton.toggleAttribute('sbgcui_self_stats');
					compareButton.classList.toggle('fa-solid-scale-unbalanced');
					compareButton.classList.toggle('fa-solid-scale-unbalanced-flip');

					statTitles.forEach(span => {
						const title = span.innerText;
						let key = Object.entries(i18nextStats).find(e => e[1] == title)[0];

						key = key.replace('total-xp', 'xp').replace('playing-since', 'created_at');

						if (compareButton.hasAttribute('sbgcui_self_stats')) {
							const diff = key == 'created_at' ? (Date.parse(selfStats[key]) - Date.parse(playerStats[key])) : (playerStats[key] - selfStats[key]);
							const diffColor = diff > 0 ? 'red' : diff < 0 ? 'green' : '';

							span.nextSibling.innerText = formatStatValue(key, selfStats[key]);
							span.nextSibling.style.setProperty('--sbgcui-diff-color', diffColor);
						} else {
							span.nextSibling.innerText = formatStatValue(key, playerStats[key]);
							span.nextSibling.style.removeProperty('--sbgcui-diff-color');
						}
					});

					regDateSpan.style.setProperty('--sbgcui-reg-date', calcPlayingTime(compareButton.hasAttribute('sbgcui_self_stats') ? selfStats.created_at : playerStats.created_at));
				}

				function formatStatValue(key, value) {
					const lang = i18next.resolvedLanguage ?? 'en';
					const formatter = new Intl.NumberFormat(i18next.language);

					if (/^guard_/.test(key)) {
						return i18next.t('units.n-days', { count: value });
					}

					switch (key) {
						case 'max_line':
							return value < 1000 ? i18next.t('units.m', { count: value }) : i18next.t('units.km', { count: value / 1000 });
						case 'max_region':
						case 'regions_area':
							return /*value < 1 ? i18next.t('units.sqm', { count: value * 1e6 }) : */i18next.t('units.sqkm', { count: value });
						case 'xp':
							return `${formatter.format(value)} ${i18next.t('units.pts-xp')}`;
						case 'created_at':
							return new Date(value).toLocaleDateString(i18next.language, { day: 'numeric', month: 'long', year: 'numeric' });
						default:
							return formatter.format(value);
					}
				}

				function profileOpenHandler() {
					if (player.name == profileNameSpan.innerText) {
						compareButton.classList.add('sbgcui_hidden');
					} else {
						compareButton.classList.remove('sbgcui_hidden');
					}

					compareButton.removeAttribute('sbgcui_self_stats');
				}

				function reset() {
					const statValues = document.querySelectorAll('.pr-stat-val');
					compareButton.removeAttribute('sbgcui_self_stats');
					compareButton.classList.replace('fa-solid-scale-unbalanced-flip', 'fa-solid-scale-unbalanced');
					statValues.forEach(span => {
						span.style.removeProperty('--sbgcui-diff-color');
					});
				}

				compareButton.classList.add('fa', 'fa-solid-scale-unbalanced', 'sbgcui_profile-compare');

				compareButton.addEventListener('click', toggleValues);
				profilePopup.addEventListener('profilePopupOpened', profileOpenHandler);
				profilePopup.addEventListener('profilePopupClosed', reset);

				bottomButtons.appendChild(compareButton);
			}


			/* Кнопки смены сортировки и вписывания линии при рисовании */
			{
				function fit() {
					const tempLine = tempLinesSource?.getFeatures()[0].getGeometry();
					const padding = [10, 0, window.innerHeight - drawSlider.getBoundingClientRect().y + 30, 0];

					if (tempLine == undefined) { return; }
					view.fitTempLine(tempLine, padding);
				}

				function flip() {
					const refs = refsList.childNodes;
					const refsReversed = [...refs].reverse();

					refsList.replaceChildren(...refsReversed);
					window.draw_slider.refresh();

					flipButton.classList.toggle('fa-solid-arrow-down-short-wide');
					flipButton.classList.toggle('fa-solid-arrow-down-wide-short');
				}

				function resetIcon() {
					flipButton.classList.replace('fa-solid-arrow-down-wide-short', 'fa-solid-arrow-down-short-wide');
				}

				const fitButton = document.createElement('button');
				const flipButton = document.createElement('button');
				const sliderButtons = document.querySelector('.draw-slider-buttons');

				fitButton.classList.add('fa', 'fa-solid-up-right-and-down-left-from-center', 'sbgcui_drawslider_fit');
				flipButton.classList.add('fa', 'fa-solid-arrow-down-short-wide', 'fa-rotate-270', 'sbgcui_drawslider_sort');

				fitButton.addEventListener('click', fit);
				flipButton.addEventListener('click', flip);

				drawSlider.addEventListener('drawSliderOpened', resetIcon);

				sliderButtons.append(flipButton, fitButton);
			}


			/* Показ опыта за снос */
			{
				function updateReward() {
					destroyRewardDiv.innerText = `${rewardText}: ${formatter.format(lastOpenedPoint.destroyReward)} ${i18next.t('units.pts-xp')}`;
				}

				const pointControls = document.querySelector('.info.popup .i-buttons');
				const pointStat = document.querySelector('.info.popup .i-stat');
				const destroyRewardDiv = document.createElement('div');
				const rewardText = i18next.language.includes('ru') ? 'Награда' : 'Reward';
				const formatter = new Intl.NumberFormat(i18next.language);

				destroyRewardDiv.classList.add('i-stat__entry');

				pointStat.insertBefore(destroyRewardDiv, pointControls);

				pointPopup.addEventListener('pointPopupOpened', updateReward);
				pointPopup.addEventListener('pointRepaired', updateReward);
				pointPopup.addEventListener('lineDrawn', updateReward);
			}


			/* Точка в [0, 0] */
			{
				try {
					const popup = await getHTMLasset('zero-point-info');
					const zeroPointFeature = new ol.Feature({
						geometry: new ol.geom.Point([0, 0])
					});

					popup.addEventListener('click', () => { popup.classList.add('sbgcui_hidden'); });
					document.body.appendChild(popup);

					zeroPointFeature.setId('sbgcui_zeroPoint');
					zeroPointFeature.setStyle(new ol.style.Style({
						geometry: new ol.geom.Circle([0, 0], 30),
						fill: new ol.style.Fill({ color: '#BB7100' }),
						stroke: new ol.style.Stroke({ color: window.TeamColors[3].stroke(), width: 5 }),
						text: new ol.style.Text({
							font: '30px Manrope',
							text: '?',
							fill: new ol.style.Fill({ color: '#000' }),
							stroke: new ol.style.Stroke({ color: '#FFF', width: 3 })
						}),
					}));

					map.on('click', event => {
						const features = map.getFeaturesAtPixel(event.pixel, {
							layerFilter: layer => layer.get('name') == 'sbgcui_points',
						});

						if (features.includes(zeroPointFeature)) {
							setTimeout(() => popup.classList.remove('sbgcui_hidden'), 100);
						}
					});
					customPointsSource.addFeature(zeroPointFeature);
				} catch (error) {
					console.log('SBG CUI: Ошибка (точка [0, 0]).', error);
				}
			}


			/* Количество регионов под кликом */
			{
				function buttonClickHandler() {
					const toast = createToast('Нажмите на регион чтобы узнать, сколько их в этом месте.', undefined, undefined, 'sbgcui_toast-selection');
					toast.showToast();

					map.un('click', mapClickHandler);
					map.once('click', mapClickHandler);
				}

				function mapClickHandler(event) {
					const features = map.getFeaturesAtPixel(event.pixel, {
						layerFilter: layer => layer.get('name') == 'regions',
					});
					const areasM2 = features.map(feature => ol.sphere.getArea(feature.getGeometry()));
					const minAreaM2 = Math.min(...areasM2);
					const maxAreaM2 = Math.max(...areasM2);
					const minArea = /*minAreaM2 < 1e6 ? i18next.t('units.sqm', { count: minAreaM2 }) : */i18next.t('units.sqkm', { count: minAreaM2 / 1e6 });
					const maxArea = /*maxAreaM2 < 1e6 ? i18next.t('units.sqm', { count: maxAreaM2 }) : */i18next.t('units.sqkm', { count: maxAreaM2 / 1e6 });
					let message = `Количество регионов в точке: ${features.length}.`;

					if (features.length == 1) { message += `\n\nПлощадь региона: ${maxArea}.`; }
					if (features.length > 1) { message += `\n\nПлощадь самого большого региона: ${maxArea}.\nПлощадь самого маленького региона: ${minArea}.`; }

					alert(message);
				}

				const button = document.createElement('button');

				button.classList.add('fa', 'fa-brands-stack-overflow');
				button.addEventListener('click', buttonClickHandler);

				toolbar.addItem(button, 5);
			}


			/* Дата захвата точки */
			{
				function updateCaptureDate(event) {
					const { captureDate, guardDays, guid } = event.detail;

					if (guid != lastOpenedPoint.guid) { return; }
					if (!config.ui.pointDischargeTimeout) { return; }

					if (captureDate != null) {
						const formattedCaptureDate = formatter.format(captureDate);
						const guardDays = Math.floor((Date.now() - captureDate) / 1000 / 60 / 60 / 24);
						timeoutSpan.innerText = i18next.t('sbgcui.captured', { date: formattedCaptureDate, guard: guardDays });
					} else {
						timeoutSpan.innerText = i18next.t('sbgcui.guard', { guard: guardDays });
					}
				}

				const timeoutSpan = document.createElement('span');
				const formatterOptions = { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
				const formatter = new Intl.DateTimeFormat('ru-RU', formatterOptions);

				timeoutSpan.classList.add('sbgcui_discharge_timeout');
				document.querySelector('.i-stat').appendChild(timeoutSpan);

				pointPopup.addEventListener('pointPopupOpened', () => { timeoutSpan.innerText = '~'; });
				window.addEventListener('pointCaptureDateFound', updateCaptureDate);
				window.addEventListener('pointCaptured', updateCaptureDate);
			}


			/* Вращение карты */
			{
				let latestTouchPoint = null;
				let touches = [];
				const lockRotationButton = document.createElement('button');
				const mapDiv = document.getElementById('map');

				function rotateView(pointA, pointB) {
					const center = map.getPixelFromCoordinate(view.getCenter());
					const aAngle = Math.atan2((pointA[1] - center[1]), (pointA[0] - center[0]));
					const bAngle = Math.atan2((pointB[1] - center[1]), (pointB[0] - center[0]));
					const anchor = map.getCoordinateFromPixel(center);

					view.adjustRotation(bAngle - aAngle, anchor);
				}

				function resetView(isCompleted) {
					if (isCompleted) { return; }

					view.animate({ rotation: 0 }, resetView);
				}

				function toggleRotationLock(event) {
					// Если был эвент нажатия кнопки — переключаем.
					// Иначе функция вызвана при запуске скрипта и должна установить сохранённое ранее значение.
					if (event) { isRotationLocked = !isRotationLocked; }

					if (isRotationLocked) { resetView(); }
					pinchRotateInteraction.setActive(!isRotationLocked);
					lockRotationButton.setAttribute('sbgcui_locked', isRotationLocked);
					database.transaction('state', 'readwrite').objectStore('state').put(isRotationLocked, 'isRotationLocked');
				}

				function touchStartHandler(event) {
					if (event.targetTouches.length > 1 || isFollow == false || event.target.nodeName != 'CANVAS' || isRotationLocked) {
						latestTouchPoint = null;
						return;
					} else {
						latestTouchPoint = [event.targetTouches[0].clientX, event.targetTouches[0].clientY];
						touches = [];
					}
				}

				function touchMoveHandler(event) {
					event.preventDefault();

					if (latestTouchPoint == null) { return; }

					const ongoingTouchPoint = [event.targetTouches[0].clientX, event.targetTouches[0].clientY];

					rotateView(latestTouchPoint, ongoingTouchPoint);
					latestTouchPoint = ongoingTouchPoint;
					touches.push(ongoingTouchPoint);
				}

				function touchEndHandler() {
					if (touches.length == 0) { return; } else { window.requestEntities(); }
					touches = [];
					latestTouchPoint = null;
					database.transaction('state', 'readwrite').objectStore('state').put(view.getRotation(), 'viewRotation');
				}

				function rotationChangeHandler() {
					const isAnimating = view.getAnimating();

					if (isFollow && !isAnimating) { view.setCenter(playerFeature.getGeometry().getCoordinates()); }
					lockRotationButton.style.setProperty('--sbgcui_angle', `${view.getRotation() * 180 / Math.PI}deg`);
				}

				const request = database.transaction('state', 'readwrite').objectStore('state').get('isRotationLocked');
				request.addEventListener('success', event => {
					isRotationLocked = event.target.result;
					toggleRotationLock();
				});

				lockRotationButton.classList.add('fa', 'fa-solid-compass', 'sbgcui_lock_rotation');
				lockRotationButton.addEventListener('click', toggleRotationLock);

				toggleFollow.before(lockRotationButton);

				mapDiv.addEventListener('touchstart', touchStartHandler);
				mapDiv.addEventListener('touchmove', touchMoveHandler);
				mapDiv.addEventListener('touchend', touchEndHandler);

				view.on('change:rotation', rotationChangeHandler);
			}


			/* Навигация и переход к точке */
			{
				const jumpToButton = document.createElement('button');

				jumpToButton.classList.add('fa', 'fa-solid-map-location-dot', 'sbgcui_button_reset', 'sbgcui_jumpToButton');
				jumpToButton.addEventListener('click', () => { jumpTo(lastOpenedPoint.coords); highlightFeature(undefined, lastOpenedPoint.coords); });
				pointPopup.appendChild(jumpToButton);

				try {
					function createURL(app, routeType) {
						const [lonA, latA] = ol.proj.toLonLat(playerFeature.getGeometry().getCoordinates());
						const [lonB, latB] = lastOpenedPoint.coords;
						let url;

						switch (app) {
							case 'yamaps':
								url = `yandexmaps://maps.yandex.ru/?rtext=${latA},${lonA}~${latB},${lonB}&rtt=${routeType}`;
								break;
							case 'yanavi':
								url = `yandexnavi://build_route_on_map?lat_from=${latA}&lon_from=${lonA}&lat_to=${latB}&lon_to=${lonB}`;
								break;
							case 'dgis':
								url = `dgis://2gis.ru/routeSearch/rsType/${routeType}/from/${lonA},${latA}/to/${lonB},${latB}`;
								break;
							case 'gmaps':
								//url = `comgooglemaps://?saddr=${latA},${lonA}&daddr=${latB},${lonB}&directionsmode=${routeType}`;
								url = `https://www.google.com/maps/dir/?api=1&origin=${latA},${lonA}&destination=${latB},${lonB}&travelmode=${routeType}`;
								break;
						}

						return url;
					}

					function routeTypeClickHandler(event) {
						const app = event.currentTarget.dataset.app;
						const routeType = event.target.dataset.routetype;

						if (event.target.nodeName != 'LI') { return; }
						if (event.target.hasAttribute('data-selected')) {
							delete event.target.dataset.selected;
							delete submitButton.dataset.app;
							delete submitButton.dataset.routetype;
							return;
						}

						navPopup.querySelectorAll('li[data-selected]').forEach(e => { delete e.dataset.selected; })
						event.target.dataset.selected = '';
						submitButton.dataset.app = app;
						submitButton.dataset.routetype = routeType;
					}

					function closeNavPopup() {
						navPopup.classList.add('sbgcui_hidden');
					}

					function toggleNavPopup() {
						navPopup.classList.toggle('sbgcui_hidden');
					}

					const navPopup = await getHTMLasset('navigate');
					const coordsSpan = navPopup.querySelector('.sbgcui_navigate-coords');
					const form = navPopup.querySelector('form');
					const menus = navPopup.querySelectorAll('menu');
					const [cancelButton, submitButton] = navPopup.querySelectorAll('.sbgcui_navigate-form-buttons > button');
					const navButton = document.createElement('button');

					navButton.classList.add('fa', 'fa-solid-route', 'sbgcui_button_reset', 'sbgcui_navbutton');
					navButton.addEventListener('click', toggleNavPopup);
					pointPopup.appendChild(navButton);

					pointPopup.addEventListener('pointPopupOpened', () => {
						coordsSpan.innerText = lastOpenedPoint.coords.slice().reverse().join(', ');
					});
					coordsSpan.addEventListener('click', () => {
						window.navigator.clipboard.writeText(coordsSpan.innerText).then(() => {
							const toast = createToast('Координаты скопированы в буфер обмена.');
							toast.showToast();
						});
					});

					form.addEventListener('submit', event => { event.preventDefault(); })

					menus.forEach(menu => {
						menu.addEventListener('click', routeTypeClickHandler);
					});

					cancelButton.addEventListener('click', closeNavPopup);
					submitButton.addEventListener('click', () => {
						const url = createURL(submitButton.dataset.app, submitButton.dataset.routetype);
						if (url != undefined) {
							window.location.href = url;
							closeNavPopup();
						}
					});

					pointPopupCloseButton.addEventListener('click', closeNavPopup);
					jumpToButton.addEventListener('click', closeNavPopup);

					document.body.appendChild(navPopup);
				} catch (error) {
					console.log('SBG CUI: Ошибка (меню навигации к точке).', error);
				}
			}


			/* Поворот стрелки игрока */
			{
				function rotateArrow(event) {
					const deviceRotationDeg = event.webkitCompassHeading;

					if (Math.abs(playerArrowRotationDeg - deviceRotationDeg) > 3) {
						const playerArrowRotationRad = deviceRotationDeg * Math.PI / 180;

						playerArrow.setRotation(playerArrowRotationRad + view.getRotation());
						playerFeature.changed();

						playerArrowRotationDeg = deviceRotationDeg;
					}
				}

				const playerArrow = playerFeature.getStyle()[0].getImage();
				let playerArrowRotationDeg = 0;

				if (DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
					document.body.addEventListener('click', () => { DeviceOrientationEvent.requestPermission(); }, { once: true });

					window.addEventListener('deviceorientation', rotateArrow);
				}
			}


			/* Показать рефы на карте */
			{
				function deleteRefs() {
					if (uniqueRefsToDelete == 0) { return; }

					const urtdSuffix = uniqueRefsToDelete % 10 == 1 ? 'ки' : 'ек';
					let ortdSuffix;

					switch (overallRefsToDelete % 10) {
						case 1:
							ortdSuffix = 'ку';
							break;
						case 2:
						case 3:
						case 4:
							ortdSuffix = 'ки';
							break;
						default:
							ortdSuffix = 'ок';
							break;
					}

					if (!confirm(`Удалить ${overallRefsToDelete} ссыл${ortdSuffix} от ${uniqueRefsToDelete} точ${urtdSuffix}?`)) { return; }

					const selectedFeatures = pointsWithRefsSource.getFeatures().filter(feature => feature.get('isSelected') == true);
					const refsToDelete = { 3: {} };

					selectedFeatures.forEach(feature => {
						const guid = feature.getId(), amount = feature.get('amount');
						refsToDelete[3][guid] = { amount };
					});

					const entries = Object.entries(refsToDelete[3]);
					const items = Object.fromEntries(entries.map(item => [item[0], item[1].amount]));

					deleteItems(items, 3)
						.then(response => {
							if ('error' in response) { throw response.error; }

							const invTotal = response.count.total;

							invTotalSpan.innerText = invTotal;
							if (inventoryButton.style.color.match('accent') && invTotal < INVENTORY_LIMIT) { inventoryButton.style.color = ''; }

							deleteFromCacheAndSliders(refsToDelete);

							uniqueRefsToDelete = 0;
							overallRefsToDelete = 0;
							selectedFeatures.forEach(feature => { pointsWithRefsSource.removeFeature(feature); });

							trashCanButton.style.setProperty('--sbgcui-overall-refs-to-del', `"0"`);
							trashCanButton.style.setProperty('--sbgcui-unique-refs-to-del', `"0"`);
						})
						.catch(error => {
							const message = `Ошибка при удалении ссылок. <br>${error?.message || error}`;
							const toast = createToast(message, undefined, undefined, 'error-toast');
							toast.showToast();

							console.log('SBG CUI: Ошибка при удалении ссылок.', error);
						});
				}

				function hideViewer() {
					pointsWithRefsSource.clear(true);

					hideViewerButton.classList.add('sbgcui_hidden');
					trashCanButton.classList.add('sbgcui_hidden');
					showControls();

					isRefsViewerOpened = false;
					overallRefsToDelete = 0;
					uniqueRefsToDelete = 0;

					map.un('click', mapClickHandler);

					view.setZoom(beforeOpenZoom);
					//view.setCenter(playerFeature.getGeometry().getCoordinates());

					window.requestEntities();
				}

				function mapClickHandler(event) {
					function toggleSelectState(feature) {
						const { amount, isSelected } = feature.getProperties();

						feature.set('isSelected', !isSelected);

						overallRefsToDelete += amount * (isSelected ? -1 : 1);
						uniqueRefsToDelete += isSelected ? -1 : 1;
						trashCanButton.style.setProperty('--sbgcui-overall-refs-to-del', `"${overallRefsToDelete}"`);
						trashCanButton.style.setProperty('--sbgcui-unique-refs-to-del', `"${uniqueRefsToDelete}"`);
					}

					const options = {
						hitTolerance: 0,
						layerFilter: layer => layer.get('name') == 'sbgcui_points_with_refs'
					};

					map.forEachFeatureAtPixel(event.pixel, toggleSelectState, options);
				}

				function showViewer() {
					getInventory()
						.then(inventory => {
							const refs = inventory.filter(item => item.t == 3);
							const layers = map.getAllLayers();

							beforeOpenZoom = view.getZoom();
							isRefsViewerOpened = true;
							hideViewerButton.classList.remove('sbgcui_hidden');
							trashCanButton.classList.remove('sbgcui_hidden');
							inventoryPopup.classList.add('hidden');
							if (!attackSlider.classList.contains('hidden')) { click(attackButton); }
							hideControls();

							trashCanButton.style.setProperty('--sbgcui-overall-refs-to-del', `"0"`);
							trashCanButton.style.setProperty('--sbgcui-unique-refs-to-del', `"0"`);

							layers.forEach(layer => {
								if (/^(lines|points|regions)/.test(layer.get('name'))) { layer.getSource().clear(); }
							});

							refs.forEach(ref => {
								const { a: amount, c: coords, g: refGuid, l: pointGuid, ti: title } = ref;
								const mapCoords = ol.proj.fromLonLat(coords);
								const feature = new ol.Feature({ geometry: new ol.geom.Point(mapCoords) });

								feature.setId(refGuid);
								feature.setProperties({ amount, mapCoords, pointGuid, title });

								pointsWithRefsSource.addFeature(feature);

								getPointData(pointGuid).then(data => {
									// Приводим к числу, т.к. у пустой точки команда null вместо 0,
									// и при обновлении значения с начального undefined на null, OL не обновляет фичу.
									feature.set('team', +data.te);
								});
							});

							map.on('click', mapClickHandler);
						})
						.catch(error => {
							console.log('SBG CUI: Ошибка при получении инвентаря.', error);
						});
				}

				const pointsWithRefsSource = new ol.source.Vector();
				const pointsWithRefsLayer = new ol.layer.Vector({
					className: 'ol-layer__sbgcui_points_with_refs',
					declutter: true,
					minZoom: 0,
					name: 'sbgcui_points_with_refs',
					source: pointsWithRefsSource,
					style: (feature, resolution) => {
						const { amount, isSelected, mapCoords, team, title } = feature.getProperties();
						const fillColor = () => isSelected ? '#BB7100' : (team == undefined ? '#11111180' : team == 0 ? '#66666680' : window.TeamColors[team].fill);
						const strokeColor = () => team == undefined ? '#66666680' : team == 0 ? '#CCCCCC80' : window.TeamColors[team].stroke();
						const zoom = view.getZoom();
						const markerSize = zoom >= 16 ? 20 : 20 * resolution / 2.5;
						const markerStyle = new ol.style.Style({
							geometry: new ol.geom.Circle(mapCoords, isSelected ? markerSize * 1.4 : markerSize),
							fill: new ol.style.Fill({ color: fillColor() }),
							stroke: new ol.style.Stroke({ color: strokeColor(), width: isSelected ? 4 : 3 }),
							zIndex: isSelected ? 3 : 1,
						});
						const amountStyle = new ol.style.Style({
							text: new ol.style.Text({
								fill: new ol.style.Fill({ color: '#000' }),
								font: `${zoom >= 15 ? 14 : 12}px Manrope`,
								stroke: new ol.style.Stroke({ color: '#FFF', width: 3 }),
								text: zoom >= 15 ? String(amount) : null,
							}),
							zIndex: 2,
						});
						const titleStyle = new ol.style.Style({
							text: new ol.style.Text({
								fill: new ol.style.Fill({ color: '#000' }),
								font: `12px Manrope`,
								offsetY: 25 / resolution,
								stroke: new ol.style.Stroke({ color: '#FFF', width: 3 }),
								text: zoom >= 17 ? (title.length <= 12 ? title : title.slice(0, 10).trim() + '...') : null,
								textBaseline: 'top',
							}),
							zIndex: 2,
						});

						return [markerStyle, amountStyle, titleStyle];
					},
					zIndex: 8,
				});
				const hideViewerButton = document.createElement('button');
				const invControls = document.querySelector('.inventory__controls');
				const invDelete = document.querySelector('#inventory-delete');
				const showViewerButton = document.createElement('button');
				const trashCanButton = document.createElement('button');
				const buttonsWrapper = document.createElement('div');
				let overallRefsToDelete = 0;
				let uniqueRefsToDelete = 0;
				let beforeOpenZoom;

				hideViewerButton.id = 'sbgcui_hide_viewer';
				hideViewerButton.classList.add('sbgcui_button_reset', 'sbgcui_hidden', 'fa', 'fa-solid-xmark');

				showViewerButton.classList.add('sbgcui_show_viewer');
				showViewerButton.innerText = 'На карте';

				trashCanButton.classList.add('sbgcui_button_reset', 'sbgcui_hidden', 'fa', 'fa-solid-trash');
				trashCanButton.id = 'sbgcui_batch_remove';

				showViewerButton.addEventListener('click', showViewer);
				hideViewerButton.addEventListener('click', hideViewer);
				trashCanButton.addEventListener('click', deleteRefs);

				invControls.insertBefore(showViewerButton, invDelete);
				buttonsWrapper.append(hideViewerButton, trashCanButton);
				document.body.appendChild(buttonsWrapper);

				map.addLayer(pointsWithRefsLayer);
			}


			/* Логи и консоль */
			{
				sessionStorage.removeItem(RequestLog.storageName);
				try {
					function clearStorage() {
						const date = datePicker.getAttribute('min');
						const totalEntries = datePicker.dataset.totalentries;
						const days = Math.floor((Date.now() - new Date(date)) / 1000 / 60 / 60 / 24);

						if (totalEntries == 0) { alert('Записей не обнаружено.'); return; }

						if (confirm(`Очистить всю историю действий? \nВы удалите ${totalEntries} записей за последние ${days} дней (с ${date}).`)) {
							if (confirm('Подтвердите удаление истории действий за всё время.')) {
								const logsStore = database.transaction('logs', 'readwrite').objectStore('logs');
								const request = logsStore.clear();
								request.addEventListener('success', () => {
									alert('История действий очищена.');
									hidePopup();
								});
							}
						};
					}

					function showDevLogs() {
						[header, tagsWrapper, logContent].forEach(element => element.classList.add('sbgcui_hidden'));
						devLogs.classList.remove('sbgcui_hidden');
						showConsoleLog();
					}

					function hideDevLogs() {
						consoleContent.innerHTML = '';
						networkContent.innerHTML = '';
						[header, tagsWrapper, logContent].forEach(element => element.classList.remove('sbgcui_hidden'));
						devLogs.classList.add('sbgcui_hidden');
					}

					function showConsoleLog() {
						consoleTab.setAttribute('active', '');
						networkTab.removeAttribute('active');
						networkContent.classList.add('sbgcui_hidden');
						consoleContent.classList.remove('sbgcui_hidden');
						consoleContent.innerHTML = '';
						networkContent.innerHTML = '';

						logsNerrors.forEach(data => {
							const entry = document.createElement('p');
							const entryTime = document.createElement('span');
							const entryDescr = document.createElement('div');

							entry.classList.add('sbgcui_log-content-entry');
							entryTime.classList.add('sbgcui_log-content-entry-time');
							entryDescr.classList.add('sbgcui_log-content-entry-description');

							const format = { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3, hourCycle: 'h23' };
							entryTime.innerText = new Date(data.timestamp).toLocaleString(i18next.language, format).replace(/,|\./, ':');

							entryDescr.innerHTML = data.messages.join('<br>');

							entry.append(entryTime, entryDescr);
							consoleContent.prepend(entry);
						});
					}

					function showNetworkLog() {
						networkTab.setAttribute('active', '');
						consoleTab.removeAttribute('active');
						consoleContent.classList.add('sbgcui_hidden');
						networkContent.classList.remove('sbgcui_hidden');
						consoleContent.innerHTML = '';
						networkContent.innerHTML = '';

						RequestLog.fullLog.forEach(log => {
							const details = document.createElement('details');
							const summary = document.createElement('summary');
							const reqPre = document.createElement('pre');
							const resPre = document.createElement('pre');
							const errPre = document.createElement('pre');
							const reqHeaderSpan = document.createElement('span');
							const resHeaderSpan = document.createElement('span');
							const errHeaderSpan = document.createElement('span');
							const resTimeStatusSpan = document.createElement('span');
							const format = { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3, hourCycle: 'h23' };

							summary.innerText = `[${new Date(log.time.request).toLocaleString(i18next.language, format).replace(/,|\./, ':')}] [${log.status ?? '???'}] ${log.request.url}`;
							reqHeaderSpan.innerText = 'REQUEST:';
							reqPre.append(reqHeaderSpan, log.formattedRequest);
							if (log.status != undefined) {
								resHeaderSpan.innerText = 'RESPONSE:';
								resTimeStatusSpan.innerText = `${log.responseTime} ms [${log.status}] ${log.statusText}`;
								resPre.append(resHeaderSpan, resTimeStatusSpan, (log.response == undefined ? '' : log.formattedResponse));
							}
							if (log.error != undefined) {
								errHeaderSpan.innerText = `ERROR:`;
								errPre.append(errHeaderSpan, log.formattedError);
							}

							if (log.response == undefined || log.error != undefined || log.status >= 400) { summary.setAttribute('error', ''); }
							if (log.isApiError) { summary.setAttribute('api-error', ''); }

							details.append(summary, reqPre, resPre, errPre);
							networkContent.prepend(details);
						});
					}

					function toggleDevLogs() {
						const isDevLogsHidden = devLogs.classList.contains('sbgcui_hidden');
						isDevLogsHidden ? showDevLogs() : hideDevLogs();
					}

					function hidePopup() {
						popup.classList.add('sbgcui_hidden');
						logContent.innerHTML = '';
						hideDevLogs();
						isLogsViewerOpened = false;
					}

					function showPopup() {
						const logsStore = database.transaction('logs', 'readonly').objectStore('logs');
						const request = logsStore.getAllKeys();

						request.addEventListener('success', event => {
							const offsetMs = new Date().getTimezoneOffset() * 60 * 1000;
							const timestamps = event.target.result;
							const firstEntryTimestamp = timestamps[0] || Date.now();
							const latestEntryTimestamp = timestamps[timestamps.length - 1] || Date.now();
							const firstEntryDate = new Date(firstEntryTimestamp - offsetMs).toISOString().slice(0, 10);
							const latestEntryDate = new Date(latestEntryTimestamp - offsetMs).toISOString().slice(0, 10);

							datePicker.setAttribute('min', firstEntryDate);
							datePicker.setAttribute('max', latestEntryDate);
							datePicker.setAttribute('value', latestEntryDate);
							datePicker.setAttribute('data-totalEntries', timestamps.length);
							datePicker.value = latestEntryDate;

							datePicker.dispatchEvent(new Event('change'));

							popup.classList.remove('sbgcui_hidden');
						});
						isLogsViewerOpened = true;
					}

					function showActionsLog() {
						const upperBound = new Date(datePicker.value).setHours(0, 0, 0, 0);
						const lowerBound = new Date(datePicker.value).setHours(23, 59, 59, 999);
						const keyRange = IDBKeyRange.bound(upperBound, lowerBound);
						const logsStore = database.transaction('logs', 'readonly').objectStore('logs');
						const request = logsStore.getAll(keyRange);

						logContent.innerHTML = '';
						logContent.setAttribute('data-searchInProgress', '');
						tagsWrapper.dataset.totalentries = 0;

						request.addEventListener('success', event => {
							const logs = event.target.result;
							if (logs.length == 0) {
								logContent.removeAttribute('data-searchInProgress');
								return;
							}

							const guidsTitles = {};
							const pointsWithoutTitle = [];

							logs.reverse();
							logs.map(action => {
								switch (action.type) {
									case 'capture':
									case 'uniqcap':
									case 'deploy':
									case 'upgrade':
									case 'discover':
										guidsTitles[action.point] = guidsTitles[action.point] || action.title;
										break;
									case 'draw':
										guidsTitles[action.from] = guidsTitles[action.fromTitle] || action.fromTitle;
										guidsTitles[action.to] = guidsTitles[action.toTitle] || action.toTitle;
										break;
									case 'destroy':
									case 'broom':
										action.points.forEach(guid => { guidsTitles[guid] = guidsTitles[guid] || undefined; });
										break;
								}
							});
							for (let guid in guidsTitles) {
								if (guidsTitles[guid] == undefined) { pointsWithoutTitle.push(guid); }
							}

							const promises = pointsWithoutTitle.map(guid => getPointData(guid));
							Promise.all(promises)
								.then(results => {
									logContent.removeAttribute('data-searchInProgress');
									results.forEach(point => { guidsTitles[point.g] = point.t; });
									logs.forEach(action => {
										const entry = document.createElement('p');
										const entryTime = document.createElement('span');
										const entryDescr = document.createElement('div');

										entry.classList.add('sbgcui_log-content-entry');
										entryTime.classList.add('sbgcui_log-content-entry-time');
										entryDescr.classList.add('sbgcui_log-content-entry-description');

										entry.style.setProperty('--action-type', `"${action.type}"`);
										entry.style.setProperty('--action-color', `var(--${action.type})`);
										entry.setAttribute('data-action', action.type);

										const format = { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' };
										entryTime.innerText = new Date(action.timestamp).toLocaleString(i18next.language, format);

										switch (action.type) {
											case 'capture':
											case 'uniqcap':
											case 'deploy':
											case 'upgrade':
											case 'discover': {
												const link = document.createElement('a');

												link.innerText = guidsTitles[action.point] || action.point;
												link.innerText += action.level != undefined ? ` [${action.type == 'discover' ? '' : '^'}${action.level}]` : '';
												link.setAttribute('data-guid', action.point);

												entryDescr.appendChild(link);

												if (action.loot?.length > 0) {
													const lootList = document.createElement('div');

													lootList.classList.add('sbgcui_log-content-entry-description-loot');

													action.loot.forEach(item => {
														const iconSpan = document.createElement('span');
														const textSpan = document.createElement('span');
														const wrapperSpan = document.createElement('span');

														switch (item.t) {
															case 1:
															case 2:
																iconSpan.classList.add('item-icon', `type-${item.t}`);
																iconSpan.style.backgroundColor = `var(--level-${item.l})`;
																textSpan.innerText = `${item.l}\nx${item.a}`;
																break;
															case 3:
																iconSpan.innerText = `${i18next.t('sbgcui.refsShort')}`;
																textSpan.innerText = `\nx${item.a}`;
																break;
															default:
																iconSpan.classList.add('item-icon', `type-${item.t}`, `rarity-${item.l}`);
																iconSpan.style.backgroundColor = 'var(--text)';
																textSpan.innerText = `\nx${item.a}`;
																break;
														}

														wrapperSpan.append(iconSpan, textSpan);
														lootList.appendChild(wrapperSpan);
													});

													entryDescr.appendChild(lootList);
												}

												break;
											}
											case 'draw': {
												const fromLink = document.createElement('a');
												const toLink = document.createElement('a');
												const fromToSpan = document.createElement('span');
												const distance = action.distance;
												const distanceString = i18next.t(`units.${distance >= 1000 ? 'km' : 'm'}`, { count: distance >= 1000 ? distance / 1000 : distance });
												const regionsAmount = action.regions instanceof Array ? action.regions.length : action.regions;
												// Сначала регионы хранились в виде массива объектов, затем в виде числа - количество регионов, сейчас в виде массива площадей.

												fromLink.innerText = guidsTitles[action.from];
												toLink.innerText = guidsTitles[action.to];

												fromLink.setAttribute('data-guid', action.from);
												toLink.setAttribute('data-guid', action.to);

												fromToSpan.classList.add('sbgcui_log-content-entry-description-fromto');

												fromToSpan.append(fromLink, '->', toLink);
												entryDescr.appendChild(fromToSpan);
												if (distance != undefined) { entryDescr.append(`${i18next.t('sbgcui.distance')}: ${distanceString}`, document.createElement('br')); }
												if (regionsAmount > 0) {
													entryDescr.append(`${i18next.t('sbgcui.region' + (regionsAmount > 1 ? 's' : ''))}: ${regionsAmount}`);

													if (typeof action.regions == 'number') { break; } // Временно регионы сохранялись просто количеством.

													const areas = action.regions.map(region => typeof region == 'number' ? region : region.a);
													const maxArea = i18next.t('units.sqkm', { count: Math.max(...areas) });
													const totalArea = i18next.t('units.sqkm', { count: areas.reduce((acc, current) => acc + current, 0) });

													if (regionsAmount == 1) {
														entryDescr.append(`. ${i18next.t('sbgcui.area')}: ${maxArea}`);
													} else {
														const br = document.createElement('br');
														entryDescr.append(br, `${i18next.t('sbgcui.max')}: ${maxArea}, ${i18next.t('sbgcui.total').toLowerCase()}: ${totalArea}`);
													}
												}

												break;
											}
											case 'destroy':
											case 'broom': {
												const { points, oldestLineDays, oldestRegionDays, xp } = action;
												const lines = action.lines instanceof Array ? action.lines.length : action.lines; // Раньше сохранялся массив.
												const regions = action.regions instanceof Array ? action.regions.length : action.regions;
												const linesString = `${i18next.t('sbgcui.line' + (lines > 1 ? 's' : ''))}: ${lines}`;
												const regionsString = `${i18next.t('sbgcui.region' + (regions > 1 ? 's' : ''))}: ${regions}`;
												const oldestLineDaysString = `${i18next.t('sbgcui.oldestLineDays')}: ${oldestLineDays}`;
												const oldestRegionDaysString = `${i18next.t('sbgcui.oldestRegionDays')}: ${oldestRegionDays}`;

												entryDescr.innerText = i18next.t('sbgcui.point' + (points.length > 1 ? 's' : '')) + ': ';
												points.forEach((guid, index) => {
													const link = document.createElement('a');

													link.innerText = guidsTitles[guid] || guid;
													link.setAttribute('data-guid', guid);

													entryDescr.appendChild(link);
													if (index < points.length - 1) { entryDescr.append(', '); }
												});

												if (lines > 0) {
													entryDescr.appendChild(document.createElement('br'));
													entryDescr.append(linesString);
													if (regions > 0) { entryDescr.append(`, ${regionsString.toLowerCase()}`) }
													if (xp != undefined) { entryDescr.append(`. XP: ${xp}`); };
													if (oldestLineDays > 0) { entryDescr.append(document.createElement('br'), oldestLineDaysString); }
													if (regions > 0 && oldestRegionDays > 0) { entryDescr.append(document.createElement('br'), oldestRegionDaysString); }
												}

												break;
											}
										}

										if (state.hiddenLogs.has(action.type)) {
											entry.setAttribute('data-hidden', '');
										} else {
											tagsWrapper.dataset.totalentries = +tagsWrapper.dataset.totalentries + 1;
										}

										entry.append(entryTime, entryDescr);
										logContent.appendChild(entry);
									});
								})
								.catch(error => {
									console.log('SBG CUI: Ошибка при получении данных точек (логи).', error);
									logContent.removeAttribute('data-searchInProgress');
								});
						});
						request.addEventListener('error', () => { logContent.removeAttribute('data-searchInProgress'); });
					}

					function showPointInfo(event) {
						const guid = event.target.dataset.guid;
						if (guid != undefined) { window.showInfo(guid); }
					}

					function toggleTag(event) {
						if (!event.target.dataset.hasOwnProperty('action')) { return; }
						const tag = event.target;
						const action = tag.dataset.action;
						const entries = document.querySelectorAll(`.sbgcui_log-content-entry[data-action="${action}"]`);

						tag.toggleAttribute('data-hidden');
						entries.forEach(entry => { entry.toggleAttribute('data-hidden'); });

						const isHidden = tag.hasAttribute('data-hidden');

						if (isHidden) {
							state.hiddenLogs.add(action);
							tagsWrapper.dataset.totalentries = +tagsWrapper.dataset.totalentries - entries.length;
						} else {
							state.hiddenLogs.delete(action);
							tagsWrapper.dataset.totalentries = +tagsWrapper.dataset.totalentries + entries.length;
						}

						const stateStore = database.transaction('state', 'readwrite').objectStore('state');
						stateStore.put(state.hiddenLogs, 'hiddenLogs');
					}

					function copyLogToClipboard(event) {
						if (event.target.closest('pre') == null) { return; }
						const log = event.target.closest('details')?.innerText?.replace(/^(\[.+\])(.+?)(\n)/, '$1$3');
						window.navigator.clipboard.writeText(log).then(() => { showToast('Выбранный лог скопирован в буфер обмена.'); });
					}

					const popup = await getHTMLasset('log');
					const closeButton = popup.querySelector('.sbgcui_log-close');
					const clearButton = popup.querySelector('.sbgcui_log-buttons-trash');
					const devButton = popup.querySelector('.sbgcui_log-buttons-dev');
					const devLogs = popup.querySelector('.sbgcui_log-dev');
					const consoleContent = popup.querySelector('.sbgcui_log-dev-console');
					const networkContent = popup.querySelector('.sbgcui_log-dev-network');
					const consoleTab = popup.querySelector('.sbgcui_log-dev-tabs-console');
					const networkTab = popup.querySelector('.sbgcui_log-dev-tabs-network');
					const datePicker = popup.querySelector('input[type="date"]');
					const header = popup.querySelector('.sbgcui_log-header');
					const jumpToButton = document.querySelector('.info > .sbgcui_jumpToButton');
					const logContent = popup.querySelector('.sbgcui_log-content');
					const tagsWrapper = popup.querySelector('.sbgcui_log-tags');
					const toolbarButton = document.createElement('button');

					state.hiddenLogs = state.hiddenLogs || new Set();

					toolbarButton.classList.add('fa', 'fa-solid-table-list');
					[...tagsWrapper.children].forEach(tag => {
						const action = tag.dataset.action;
						if (state.hiddenLogs.has(action)) { tag.setAttribute('data-hidden', ''); }
					});

					toolbarButton.addEventListener('click', showPopup);
					closeButton.addEventListener('click', hidePopup);
					clearButton.addEventListener('click', clearStorage);
					devButton.addEventListener('click', toggleDevLogs);
					consoleTab.addEventListener('click', showConsoleLog);
					networkTab.addEventListener('click', showNetworkLog);
					jumpToButton.addEventListener('click', hidePopup);
					tagsWrapper.addEventListener('click', toggleTag);
					logContent.addEventListener('click', showPointInfo);
					datePicker.addEventListener('keydown', event => { event.preventDefault(); });
					datePicker.addEventListener('change', showActionsLog);
					networkContent.addEventListener('click', copyLogToClipboard);

					toolbar.addItem(toolbarButton, 6);

					document.body.appendChild(popup);
				} catch (error) {
					console.log('SBG CUI: Ошибка (логи).', error);
				}
			}


			/* Уведомления о сносе точек */
			{
				async function getNotifs(latest) {
					return fetch(`/api/notifs${latest == undefined ? '' : '?latest=' + latest}`, {
						headers: {
							authorization: `Bearer ${player.auth}`,
							'accept-language': i18next.language
						},
						method: 'GET'
					}).then(r => r.json()).then(r => r.count ?? r.list);
				}

				async function checkAndShow() {
					const { status, duration, onClick } = config.notifications;
					if (status == 'off') { return; }
					if (status == 'fav' && Object.keys(favorites).length == 0) { return; }

					notifsCount = await getNotifs(latestNotifTime);

					if (notifsCount > 0) {
						notifs = await getNotifs();

						latestNotifTime = notifs[0].ti;

						notifs.slice(0, notifsCount).reverse().forEach(notif => {
							const { g: guid, na: attackerName, ta: attackerTeam, ti: attackDate, c: coords, t: pointTitle } = notif;
							const format = { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' };
							const attackTime = new Date(attackDate).toLocaleString(i18next.language, format);

							if (status == 'fav' && !(guid in favorites)) { return; }

							const toastNode = createToastNode(attackerName, attackerTeam, attackTime, pointTitle);
							const toast = createToast(toastNode, 'bottom left', duration, 'sbgcui_destroy_notif_toast', false);
							toast.options.selector = destroyNotifsContainer;
							toast.options.callback = () => {
								const latestNotifTimestamp = +new Date(localStorage.getItem('latest-notif'));
								const currentNotifTimestamp = +new Date(attackDate);
								if (currentNotifTimestamp > latestNotifTimestamp) { localStorage.setItem('latest-notif', attackDate); }
								if (attackDate == notifs[0].ti) { notifsButton.removeAttribute('data-count'); }
								destroyNotifsToasts.delete(toast);
							};
							if (onClick == 'jumpto') {
								toast.options.close = true;
								toast.options.onClick = () => { toast.hideToast(); jumpTo(coords); highlightFeature(undefined, coords); };
							}
							destroyNotifsToasts.add(toast);

							toast.showToast();
						});
					}
				}

				function closeToasts() {
					destroyNotifsToasts.forEach(toast => { toast.hideToast(); });
				}

				function createToastNode(attackerName, attackerTeam, attackTime, pointTitle) {
					const toastNode = document.createElement('div');
					const attackDetailsWrapper = document.createElement('span');
					const attackerNameSpan = document.createElement('span');
					const attackTimeSpan = document.createElement('span');
					const pointTitleSpan = document.createElement('span');

					toastNode.classList.add('sbgcui_destroy_notif_toast-content');
					attackerNameSpan.style.color = `var(--team-${attackerTeam})`;
					attackerNameSpan.innerText = attackerName;
					attackTimeSpan.innerText = `@ ${attackTime}`;
					pointTitleSpan.innerText = pointTitle;

					attackDetailsWrapper.append(attackerNameSpan, attackTimeSpan);
					toastNode.append(attackDetailsWrapper, pointTitleSpan);

					return toastNode;
				}

				function updateInterval() {
					if (interval != config.notifications.interval) {
						clearInterval(intervalId);
						interval = config.notifications.interval;
						intervalId = setInterval(checkAndShow, interval);
					}
				}

				const closeAllButton = document.createElement('button');
				const destroyNotifsContainer = document.createElement('div');
				const destroyNotifsToasts = new Set();

				destroyNotifsContainer.classList.add('sbgcui_destroy_notifs');
				closeAllButton.classList.add('sbgcui_button_reset', 'sbgcui_destroy_notifs-closeall');
				closeAllButton.innerText = 'Закрыть всё';
				destroyNotifsContainer.appendChild(closeAllButton);
				document.body.appendChild(destroyNotifsContainer);

				let interval = config.notifications.interval;
				let notifsCount = 0;
				let notifs = await getNotifs();
				latestNotifTime = notifs[0]?.ti ?? (new Date(0)).toISOString();

				let intervalId = setInterval(checkAndShow, interval);
				window.addEventListener('configUpdated', updateInterval);
				notifsButton.addEventListener('click', closeToasts);
				closeAllButton.addEventListener('click', closeToasts);
			}


			/* Шорткаты для удаления */
			{
				const input = document.querySelector('.inventory__manage-amount input');
				const manageAmountButtons = document.querySelector('.inventory .inventory__ma-buttons');
				const shortcuts = [10, 50, 100];
				const wrapper = document.createElement('div');

				shortcuts.forEach(amount => {
					const span = document.createElement('span');
					span.innerText = amount;
					span.dataset.amount = amount;
					wrapper.appendChild(span);
				});
				wrapper.addEventListener('click', event => {
					const amount = event.target.dataset.amount;
					const max = +input.max;

					if (amount == undefined) { return; }

					input.value = amount > max ? max : amount;
				});
				wrapper.classList.add('sbgcui_inventory__ma-shortcuts');

				manageAmountButtons.before(wrapper);
			}


			/* Поиск игрока */
			{
				const searchButton = document.createElement('button');

				function clickHandler() {
					const nickname = prompt('Введите имя игрока (чувствительно к регистру): ');
					if (nickname != null) { window.openProfile(nickname); }
				}

				searchButton.classList.add('fa', 'fa-solid-magnifying-glass', 'sbgcui_button_reset', 'sbgcui_playerSearchButton');
				searchButton.addEventListener('click', clickHandler);

				leaderboardPopup.appendChild(searchButton);
			}
		} catch (error) {
			console.log('SBG CUI: Ошибка в main.', error);
		}
	}

})();