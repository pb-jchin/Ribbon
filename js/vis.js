
// Calculations for drawing and spacing out elements on the screen

var _padding = {};
var _layout = {};
var _positions = {};
_positions.chunk = {};

// Elements on the page
var _svg;

var _svg2; // for read selection

// Data for visualization
var _current_read_index = 0;

var _Chunk_alignments = [];
var _Alignments = [];
var _Ref_intervals = [];
var _Chunk_ref_intervals = [];
var _Whole_refs = [];
var _Refs_show_or_hide = {};
var _Variants = [];

var _focal_region; // {chrom,start,end}:  one region that the bam file, variants, or majority of reads from a sam entry point towards, considered the primary region for read alignment

// Reading bam file
var _Bam = undefined;
var _Ref_sizes_from_header = {};

// Selecting region
var _region = {}; // chrom, start, end


// Various global variables to capture UI settings and static variables
var _static = {};
_static.alignment_alpha = 0.5;
_static.dotplot_ref_opacity = 0.5;
_static.margin_to_merge_ref_intervals = 10000;
_static.fraction_ref_to_show_whole = 0.30; //  for very large contigs that span most of a reference, we show the whole reference
_static.read_sort_options = [{"id":"original","description":"Original order"},{"id":"position","description":"Position of longest alignment"},{"id":"readname", "description":"Read/query name (natural sort)"},{"id":"num_alignments","description":"Number of alignments"}];
_static.color_schemes = [
	{"name":"Color scheme 1", "colors": 0},
	{"name":"Color scheme 2", "colors": 1},
	{"name":"Color scheme 3", "colors": 2},
];
_static.color_collections = [["#ff9896", "#c5b0d5", "#8c564b", "#e377c2", "#bcbd22", "#9edae5", "#c7c7c7", "#d62728", "#ffbb78", "#98df8a", "#ff7f0e", "#f7b6d2", "#c49c94", "#dbdb8d", "#aec7e8", "#17becf", "#2ca02c", "#7f7f7f", "#1f77b4", "#9467bd"],["#ffff00","#ad0000","#bdadc6", "#00ffff", "#e75200","#de1052","#ffa5a5","#7b7b00","#7bffff","#008c00","#00adff","#ff00ff","#ff0000","#ff527b","#84d6a5","#e76b52","#8400ff","#6b4242","#52ff52","#0029ff","#ffffad","#ff94ff","#004200","gray","black"],['#E41A1C', '#A73C52', '#6B5F88', '#3780B3', '#3F918C', '#47A266','#53A651', '#6D8470', '#87638F', '#A5548D', '#C96555', '#ED761C','#FF9508', '#FFC11A', '#FFEE2C', '#EBDA30', '#CC9F2C', '#AD6428','#BB614F', '#D77083', '#F37FB8', '#DA88B3', '#B990A6', '#999999']]


var _settings = {};
_settings.region_min_mapping_quality = 0;
_settings.max_num_alignments = 1000000;
_settings.min_num_alignments = 1;
_settings.max_ref_length = 0;
_settings.min_aligns_for_ref_interval = 1;
_settings.min_read_length = 0;

_settings.ribbon_vs_dotplot = "ribbon";
_settings.min_mapping_quality = 0;
_settings.min_indel_size = -1; // set to -1 to stop showing indels
_settings.min_align_length = 0; 

_settings.colors = ["#ff9896", "#c5b0d5", "#8c564b", "#e377c2", "#bcbd22", "#9edae5", "#c7c7c7", "#d62728", "#ffbb78", "#98df8a", "#ff7f0e", "#f7b6d2", "#c49c94", "#dbdb8d", "#aec7e8", "#17becf", "#2ca02c", "#7f7f7f", "#1f77b4", "#9467bd"];
_settings.colorful = true;
_settings.ribbon_outline = false;
_settings.show_only_known_references = true;
_settings.keep_duplicate_reads = false;
_settings.feature_to_sort_reads = "original";

_settings.current_input_type = "";


var _ui_properties = {};
_ui_properties.region_mq_slider_max = 0;
_ui_properties.region_mq_slider_min = 0;
_ui_properties.num_alignments_slider_max = 1000000;
_ui_properties.ref_length_slider_max = 10; 
_ui_properties.read_length_slider_max = 10; 

_ui_properties.mq_slider_max = 0;
_ui_properties.indel_size_slider_max = 0;
_ui_properties.align_length_slider_max = 0;


// Scales for visualization
var _scales = {};
_scales.read_scale = d3.scale.linear();
_scales.whole_ref_scale = d3.scale.linear();
_scales.chunk_whole_ref_scale = d3.scale.linear();
_scales.ref_interval_scale = d3.scale.linear();
_scales.chunk_ref_interval_scale = d3.scale.linear();
_scales.ref_color_scale = d3.scale.ordinal().range(_settings.colors);
_scales.variant_color_scale = d3.scale.ordinal();

var _tooltip = {};
function show_tooltip(text,x,y,parent_object) {
	parent_object.selectAll("g.tip").remove();
	_tooltip.g = parent_object.append("g").attr("class","tip");
	_tooltip.g.attr("transform","translate(" + x + "," + y +  ")").style("visibility","visible");
	
	_tooltip.width = (text.length + 4) * (_layout.svg_width/100);
	_tooltip.height = (_layout.svg_height/20);

	_tooltip.rect = _tooltip.g.append("rect")
			.attr("width",_tooltip.width)
			.attr("x",(-_tooltip.width/2))
			.attr("height",_tooltip.height)
			.attr("y",(-_tooltip.height/2))
			.attr("fill","black");

	_tooltip.tip = _tooltip.g.append("text");
	_tooltip.tip.text(text).attr("fill","white").style('text-anchor',"middle").attr("dominant-baseline","middle");
}

function responsive_sizing() {
	// console.log("responsive_sizing");

	var w = window,
		d = document,
		e = d.documentElement,
		g = d.getElementsByTagName('body')[0];

	var window_width;
	var window_height;


	window_width = (w.innerWidth || e.clientWidth || g.clientWidth)*0.98;
	window_height = (w.innerHeight || e.clientHeight || g.clientHeight)*0.96;

	top_banner_size = 60;
	_padding.top = top_banner_size;
	_padding.bottom = 0;
	_padding.left = 0;
	_padding.right = 0;
	_padding.between = 0.01*window_height;
	_padding.text = _padding.between;

	_layout.right_panel_fraction = 0.35;
	_layout.svg_width_fraction = 1-_layout.right_panel_fraction;

	_layout.svg1_height_fraction = 0.50;

	_layout.left_width = (window_width - _padding.left - _padding.right) * (1-_layout.right_panel_fraction);
	_layout.panel_width = (window_width - _padding.left - _padding.right) * _layout.right_panel_fraction;

	_layout.svg1_box_height = (window_height - _padding.top - _padding.bottom) * _layout.svg1_height_fraction;
	_layout.svg2_box_height = (window_height - _padding.top - _padding.bottom) * (1-_layout.svg1_height_fraction);
	_layout.total_height = (window_height - _padding.top - _padding.bottom);

	_layout.svg_width = _layout.left_width - _padding.between*4;
	_layout.svg_height = _layout.svg1_box_height - _padding.between*4;

	_layout.svg2_width = _layout.left_width - _padding.between*4;
	_layout.svg2_height = _layout.svg2_box_height - _padding.between*4;

	_layout.input_margin = _padding.between;

	_positions.chunk.ref_intervals = {"y":_layout.svg2_height*0.25, "x":_layout.svg2_width*0.05, "width":_layout.svg2_width*0.90, "height":_layout.svg2_height*0.65};
	_positions.chunk.reads = { "top_y":_positions.chunk.ref_intervals.y, "height":_positions.chunk.ref_intervals.height, "x": _positions.chunk.ref_intervals.x, "width":_positions.chunk.ref_intervals.width };
	_positions.chunk.variants = {"y":_layout.svg2_height*0.90, "height":_layout.svg2_height*0.03};

	d3.select("#sam_input_panel")
		.style("width",_layout.left_width + "px")
		.style("height",_layout.input_height + "px")
		.style("padding",_layout.input_margin + "px")

		// d3.select("#sam_input")
			// .style("height",(_layout.input_height-_layout.input_margin*2) + "px");

	d3.select("#svg1_panel")
		.style("width",_layout.left_width + "px")
		.style("height",_layout.svg1_box_height + "px");

	d3.select("#svg2_panel")
		.style("width",_layout.left_width + "px")
		.style("height",_layout.svg2_box_height + "px");

	d3.select("#right_panel")
		.style("width",_layout.panel_width + "px")
		.style("height",_layout.total_height + "px")
		.style("visibility","visible");

	draw_region_view();
	draw();
	refresh_visibility();

}

//////////////////// Region settings /////////////////////////

$('#region_mq_slider').slider( {
	min: 0,
	max: 1000,
	slide: function( event, ui) {
		$("#region_mq_label").html(ui.value);
		_settings.region_min_mapping_quality = ui.value;
		draw_region_view();
	}
});

$('#min_read_length_slider').slider({
	min: 0,
	max: 1000,
	slide: function (event, ui) {
		d3.select("#min_read_length_input").property("value",ui.value);
		_settings.min_read_length = ui.value;
		draw_region_view();
	}
});

$('#min_aligns_for_ref_interval_slider').slider({
	min: 1,
	max: 20,
	slide: function(event,ui) {
		d3.select("#min_aligns_for_ref_interval_label").html(ui.value);
		_settings.min_aligns_for_ref_interval = ui.value;
		apply_ref_filters();
		draw_region_view();
	}
})
$('#max_ref_length_slider').slider({
	min: 0,
	max: 1000,
	slide: function (event, ui) {
		d3.select("#max_ref_length_input").property("value",ui.value);
		_settings.max_ref_length = ui.value;
		max_ref_length_changed();
	}
});

$( "#num_aligns_range_slider" ).slider({
  range: true,
  min: 1,
  max: 500,
  values: [ 100, 300 ],
  slide: function( event, ui ) {
    $( "#num_aligns_range_label" ).html( "" + ui.values[ 0 ] + " - " + ui.values[ 1 ] );
    _settings.min_num_alignments = ui.values[0];
    _settings.max_num_alignments = ui.values[1];
    draw_region_view();
  }
});

$('#mq_slider').slider( {
	min: 0,
	max: 1000,
	slide: function( event, ui) {
		$("#mq_label").html(ui.value);
		_settings.min_mapping_quality = ui.value;
		draw();
	}
});


$('#indel_size_slider').slider( {
	min: 0,
	max: 1000,
	slide: function( event, ui) {
		$("#indel_size_label").html(ui.value);
		_settings.min_indel_size = ui.value;
		
		_Alignments = reparse_read(_Chunk_alignments[_current_read_index]).alignments;
		draw();
	}
});

$('#align_length_slider').slider( {
	min: 0,
	max: 1000,
	slide: function( event, ui) {
		$("#align_length_label").html(ui.value);
		_settings.min_align_length = ui.value;
		draw();
	}
});

function max_ref_length_changed() {
	for (var i in _Whole_refs) {
		_Refs_show_or_hide[_Whole_refs[i].chrom] = (_Whole_refs[i].size <= _settings.max_ref_length);
	}

	d3.select("#chrom_highlighted").html("by size");
	apply_ref_filters();
	draw_region_view();
}

function search_select_chrom(chrom) {
	// Reset the ref size slider to default
	_settings.max_ref_length = _ui_properties.ref_length_slider_max;
	$('#max_ref_length_slider').slider("option","value", _settings.max_ref_length);
	d3.select("#max_ref_length_input").property("value",_settings.max_ref_length);

	highlight_chromosome(chrom);
}

function search_select_read(d) {
	_current_read_index = d.index;
	select_read();
}

d3.select("#min_read_length_input").on("keyup",function() {
	_settings.min_read_length = parseInt(this.value);
	if (isNaN(_settings.min_read_length)) {
		_settings.min_read_length = 0;
	}

	$('#min_read_length_slider').slider("option","value", _settings.min_read_length);
	draw_region_view();
});

d3.select("#max_ref_length_input").on("keyup",function() {
	_settings.max_ref_length = parseInt(this.value);
	if (isNaN(_settings.max_ref_length)) {
		_settings.max_ref_length = 0;
	}

	$('#max_ref_length_slider').slider("option","value", _settings.max_ref_length);
	max_ref_length_changed();
});



$("#show_all_refs").click(function() {
	show_all_chromosomes();
	apply_ref_filters();
	draw_region_view();
})

$('#colors_checkbox').change(function() {
	_settings.colorful = this.checked
	draw();
});

$('#outline_checkbox').change(function() {
	_settings.ribbon_outline = this.checked
	draw();
});

// Initialization for beginning of app only
if (_settings.ribbon_vs_dotplot == "ribbon") {
	$(".dotplot_settings").toggle();
	d3.select("#select_ribbon").property("checked",true);
	d3.select("#select_dotplot").property("checked",false);
} else {
	$(".ribbon_settings").toggle();
	d3.select("#select_ribbon").property("checked",true);
	d3.select("#select_dotplot").property("checked",false);
}

$(".ribbon_vs_dotplot").click(function(){
	var value = d3.select("input[name=ribbon_vs_dotplot]:checked").node().value;
	_settings.ribbon_vs_dotplot = value;

	// Show settings specific to each plot
	$(".ribbon_settings").toggle();
	$(".dotplot_settings").toggle();
	
	// Redraw
	draw();

});

function draw_chunk_ref() {
	if (_Whole_refs.length == 0) {
		// console.log("No references for draw_chunk_ref, not drawing anything");
		return;
	}

	
	_positions.chunk.ref_block = {"y":_layout.svg2_height*0.15, "x":_layout.svg2_width*0.05, "width":_layout.svg2_width*0.90, "height":_layout.svg2_height*0.03};
	// Draw "Reference" label
	_svg2.append("text").attr("id","ref_tag").text("Reference").attr("x",_positions.chunk.ref_block.x+_positions.chunk.ref_block.width/2).attr("y",_positions.chunk.ref_block.y-_positions.chunk.ref_block.height*3).style('text-anchor',"middle").attr("dominant-baseline","middle");


	// _scales.read_scale.range([_positions.read.x,_positions.read.x+_positions.read.width]);
	_scales.chunk_whole_ref_scale.range([_positions.chunk.ref_block.x, _positions.chunk.ref_block.x + _positions.chunk.ref_block.width]);
	
	var font_size = parseFloat(d3.select("#ref_tag").style("font-size"));

	// Whole reference chromosomes for the relevant references:
	var ref_blocks = _svg2.selectAll("g.ref_block").data(_Whole_refs).enter()
		.append("g").attr("class","ref_block")
		.filter(function(d) {return _Refs_show_or_hide[d.chrom]})
			.attr("transform",function(d) {return "translate(" + _scales.chunk_whole_ref_scale(d.filtered_cum_pos) + "," + _positions.chunk.ref_block.y + ")"})
			.on('mouseout', function(d) {_svg2.selectAll("g.tip").remove();})
			.on("click",function(d) {highlight_chromosome(d.chrom)})
			.on('mouseover', function(d) {
				var text = d.chrom + ": " + bp_format(d.size);
				var x = _scales.chunk_whole_ref_scale(d.filtered_cum_pos + d.size/2);
				var y = _positions.chunk.ref_block.y - _padding.text*3;
				show_tooltip(text,x,y,_svg2);
			});

	ref_blocks.append("rect").attr("class","ref_block")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", function(d) {return (_scales.chunk_whole_ref_scale(d.filtered_cum_pos + d.size) - _scales.chunk_whole_ref_scale(d.filtered_cum_pos));})
		.attr("height", _positions.chunk.ref_block.height)
		.attr("fill",function(d) {return _scales.ref_color_scale(d.chrom);})
		.style("stroke-width",1).style("stroke", "black");
			
	ref_blocks.append("text").attr("class","ref_block")
		.filter(function(d) {return _Refs_show_or_hide[d.chrom]})
			.filter(function(d) { return (_scales.chunk_whole_ref_scale(d.filtered_cum_pos + d.size) - _scales.chunk_whole_ref_scale(d.filtered_cum_pos) > ((font_size/5.)*d.chrom.length));})
				.text(function(d){var chrom = d.chrom; return chrom.replace("chr","")})
				.attr("x", function(d) { return _scales.chunk_whole_ref_scale(d.filtered_cum_pos + d.size/2) - _scales.chunk_whole_ref_scale(d.filtered_cum_pos)})
				.attr("y", -_padding.text)
				.style('text-anchor',"middle").attr("dominant-baseline","bottom");
}

function comma_format(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function bp_format(x) {
	
	if (x > 1000000) {
		return (Math.round(x/1000000)).toString() + " Mb"
	}
	if (x > 1000) {
		return (Math.round(x/1000)).toString() + " kb"
	}
}

function draw_chunk_ref_intervals() {

	if (_Chunk_ref_intervals.length == 0) {
		return;
	}

	// console.log("draw_chunk_ref_intervals");
	
	_scales.chunk_ref_interval_scale.range([_positions.chunk.ref_intervals.x, _positions.chunk.ref_intervals.x+_positions.chunk.ref_intervals.width]);

	// Zoom into reference intervals where the read maps:
	_svg2.selectAll("rect.ref_interval").data(_Chunk_ref_intervals).enter()
		.append("rect").attr("class","ref_interval")
		.filter(function(d) {return (_Refs_show_or_hide[d.chrom] && d.num_alignments >= _settings.min_aligns_for_ref_interval)})
			.attr("x",function(d) { return _scales.chunk_ref_interval_scale(d.cum_pos); })
			.attr("y",_positions.chunk.ref_intervals.y)
			.attr("width", function(d) {return (_scales.chunk_ref_interval_scale(d.end)-_scales.chunk_ref_interval_scale(d.start));})
			.attr("height", _positions.chunk.ref_intervals.height)
			.attr("fill",function(d) {return _scales.ref_color_scale(d.chrom);})
			.attr("fill-opacity",_static.dotplot_ref_opacity)
			.style("stroke-width",1).style("stroke", "black")
			.on('mouseover', function(d) {
				var text = d.chrom + ": " + comma_format(d.start) + " - " + comma_format(d.end);
				var x = _scales.chunk_ref_interval_scale(d.cum_pos + (d.end-d.start)/2);
				var y = _positions.chunk.ref_intervals.y - _padding.text;
				show_tooltip(text,x,y,_svg2);
			})
			.on('mouseout', function(d) {_svg2.selectAll("g.tip").remove();});

	// Ref interval mapping back to ref
	_svg2.selectAll("path.ref_mapping").data(_Chunk_ref_intervals).enter()
		.append("path").attr("class","ref_mapping")
		.filter(function(d) {return _Refs_show_or_hide[d.chrom] && d.num_alignments >= _settings.min_aligns_for_ref_interval})
			.filter(function(d) {return map_whole_ref(d.chrom,d.start) != undefined;})
				.attr("d",function(d) {return ref_mapping_path_generator(d,true)})
				// .style("stroke-width",2)
				// .style("stroke","black")
				.attr("fill",function(d) {return _scales.ref_color_scale(d.chrom);})

}

function draw_chunk_alignments() {

	if (_Chunk_alignments.length == 0) {
		return;
	}
	
	// Focal region
	if (_focal_region != undefined) {
		_svg2.append("rect").attr("class","focal_region")
		.attr("x",function(d) { return _scales.chunk_ref_interval_scale(map_chunk_ref_interval(_focal_region.chrom,_focal_region.start)); })
		.attr("y",_positions.chunk.ref_intervals.y)
		.attr("width", function(d) {return _scales.chunk_ref_interval_scale(map_chunk_ref_interval(_focal_region.chrom,_focal_region.end)) - _scales.chunk_ref_interval_scale(map_chunk_ref_interval(_focal_region.chrom,_focal_region.start));})
		.attr("height", _positions.chunk.ref_intervals.height )
		.attr("fill","none")
		.style("stroke-width",5)
		.style("stroke", "black");	
	}

	var chunks = [];
	var counter = 0;
	for (var i in _Chunk_alignments) {
		if (_Chunk_alignments[i].alignments[0].read_length >= _settings.min_read_length  && _Chunk_alignments[i].alignments.length <= _settings.max_num_alignments && _Chunk_alignments[i].alignments.length >= _settings.min_num_alignments && _Chunk_alignments[i].max_mq >= _settings.region_min_mapping_quality) {
			var has_visible_alignments = false;
			for (var j in _Chunk_alignments[i].alignments) {
				if (_Refs_show_or_hide[_Chunk_alignments[i].alignments[j].r] == true) {
					has_visible_alignments = true;
					break;
				}
			}
			if (has_visible_alignments) {
				chunks.push(_Chunk_alignments[i]);
				chunks[counter].index = i; // to remember the data order even after sorting
				counter++;	
			}
		}
	}


	if (_settings.feature_to_sort_reads == "num_alignments") {
		// sorting by alignment_length
		chunks.sort(function(a, b){return a.alignments.length-b.alignments.length});
	} else if (_settings.feature_to_sort_reads == "readname") {
		chunks.sort(function(a, b){return natural_sort(a.readname,b.readname)});
		// sorting by readname
	} else if (_settings.feature_to_sort_reads == "original") {
		chunks.sort(function(a, b){return a.index-b.index});
		// sorting by readname
	} else if (_settings.feature_to_sort_reads == "position") {
		for (var i in chunks) {
			if (chunks[i].longest_ref_pos == undefined) {
				var index_longest = 0;
				for (var j in chunks[i].alignments) {
					if (chunks[i].alignments[j].aligned_length > chunks[i].alignments[index_longest].aligned_length) {
						index_longest = j;
					}
				}
				chunks[i].longest_ref_pos = _scales.chunk_ref_interval_scale(map_chunk_ref_interval(chunks[i].alignments[index_longest].r, chunks[i].alignments[index_longest].rs));
			}
		}

		chunks.sort(function(a, b){return a.longest_ref_pos-b.longest_ref_pos});
		// sorting by readname
	}

	var num_reads_to_show  = chunks.length;

	for (var i = 0; i < chunks.length; i++) {
		chunks[i].read_y = _positions.chunk.reads.top_y + _positions.chunk.reads.height*(i+0.5)/num_reads_to_show;
	}

	var alignment_groups = _svg2.selectAll("g.alignment_groups").data(chunks).enter()
		.append("g").attr("class","alignment_groups").attr("transform",function(d) {return "translate(" + 0 + "," + d.read_y + ")"})
		.on("click",function(d) { _current_read_index = d.index; select_read();})


	alignment_groups.selectAll("line.alignment").data(function(read_record){return read_record.alignments}).enter()
		.append("line")
			.filter(function(d) {return (_Refs_show_or_hide[d.r]) && (map_chunk_ref_interval(d.r, d.rs) != false)})
				.attr("x1",function(d) { return _scales.chunk_ref_interval_scale(map_chunk_ref_interval(d.r, d.rs)); })
				.attr("x2",function(d) { return _scales.chunk_ref_interval_scale(map_chunk_ref_interval(d.r, d.re)); })
				.attr("y1",0)
				.attr("y2",0)
				.style("stroke-width",3)
				.style("stroke",function(d) {if (d.qs < d.qe) {return "blue"} else {return "red"}})
				.style("stroke-opacity",0.5)
				.on('mouseover', function(d) {
					var text = "select read";
					var x = _scales.chunk_ref_interval_scale(map_chunk_ref_interval(d.r, (d.rs+d.re)/2));
					var y = d3.select(this.parentNode).datum().read_y - _tooltip.height;
					show_tooltip(text,x,y,_svg2);
				})
				.on('mouseout', function(d) {_svg2.selectAll("g.tip").remove();});

	// Show bed file contents:

	var variants_in_view = []
	for (var i in _Variants) {
		if (map_chunk_ref_interval(_Variants[i].chrom,_Variants[i].start) != false || map_chunk_ref_interval(_Variants[i].chrom,_Variants[i].end) != false) {
			var variant = _Variants[i];
			var start_results = closest_map_chunk_ref_interval(variant.chrom,variant.start);
			variant.start_cum_pos = _scales.chunk_ref_interval_scale(start_results.pos);
			variant.start_precision = start_results.precision;
			var end_results = closest_map_chunk_ref_interval(variant.chrom,variant.end); 
			variant.end_cum_pos = _scales.chunk_ref_interval_scale(end_results.pos);
			if (variant.end_cum_pos < variant.start_cum_pos + 4) {
				variant.start_cum_pos = variant.start_cum_pos -2;
				variant.end_cum_pos = variant.start_cum_pos + 4;
			} else if (variant.end_cum_pos < variant.start_cum_pos) {
				var tmp = variant.start_cum_pos;
				variant.start_cum_pos = variant.end_cum_pos;
				variant.end_cum_pos  = tmp;
			}
			variant.end_precision = end_results.precision;
			variants_in_view.push(variant);
		}
	}

	_svg2.selectAll("rect.variants").data(variants_in_view).enter()
		.append("rect").attr("class","variants")
			.attr("x",function(d) { return d.start_cum_pos })
			.attr("width",function(d) { return  d.end_cum_pos - d.start_cum_pos})
			.attr("y", _positions.chunk.variants.y)
			.attr("height", _positions.chunk.variants.height)
			.style("stroke","none")
			.style("fill",function(d){return _scales.variant_color_scale(d.type)})
			.on('mouseover', function(d) {
				var text = d.name;
				if (d.type != undefined) {
					text = d.name + " (" + d.type + ")";
				}
				var x = (d.start_cum_pos + d.end_cum_pos)/2;
				var y =  _positions.chunk.variants.y +  _positions.chunk.variants.height + _padding.text;
				show_tooltip(text,x,y,_svg2);
			})
			.on('mouseout', function(d) {_svg2.selectAll("g.tip").remove();});
}


function draw_region_view() {
	reset_svg2();
	draw_chunk_ref();
	draw_chunk_ref_intervals();
	draw_chunk_alignments();
}


function clear_data() {
	_Alignments = [];
	_Chunk_alignments = [];
	_Whole_refs = [];
	_Ref_intervals = [];
	_Chunk_ref_intervals = [];
	_Ref_sizes_from_header = {};
}

function highlight_chromosome(chromosome) {
	for (var chrom in _Refs_show_or_hide) {
		// console.log("hiding " + chrom);
		_Refs_show_or_hide[chrom] = false;
	}
	_Refs_show_or_hide[chromosome] = true;

	apply_ref_filters();
	draw_region_view();


	d3.select("#chrom_highlighted").html(chromosome);
	d3.select("#show_all_refs").style("display","inline");
}

function show_all_chromosomes() {
	for (var i in _Chunk_ref_intervals) {
		_Refs_show_or_hide[_Chunk_ref_intervals[i].chrom] = true;
	}
	for (var i in _Whole_refs) {
		_Refs_show_or_hide[_Whole_refs[i].chrom] = true;
	}
	d3.select("#chrom_highlighted").html("all");
	d3.select("#show_all_refs").style("display","none");
}

function apply_ref_filters() {
	var interval_cumulative_position = 0;
	for (var i in _Chunk_ref_intervals) {
		if (_Refs_show_or_hide[_Chunk_ref_intervals[i].chrom] == true) {
			if (_Chunk_ref_intervals[i].num_alignments >= _settings.min_aligns_for_ref_interval) {
				_Chunk_ref_intervals[i].cum_pos = interval_cumulative_position;
				interval_cumulative_position += _Chunk_ref_intervals[i].size;
			} else {
				_Chunk_ref_intervals[i].cum_pos = -1;
			}
		}
	}
	var whole_cumulative_position = 0;
	for (var i in _Whole_refs) {
		if (_Refs_show_or_hide[_Whole_refs[i].chrom] == true) {
			_Whole_refs[i].filtered_cum_pos = whole_cumulative_position;
			whole_cumulative_position += _Whole_refs[i].size;
		}
	}

	_scales.chunk_ref_interval_scale.domain([0,interval_cumulative_position]);
	_scales.chunk_whole_ref_scale.domain([0,whole_cumulative_position]);

	var chromosomes = d3.keys(_Refs_show_or_hide);
	chromosomes.sort(function(a, b){return a.length-b.length});

	var chrom_livesearch = d3.livesearch().max_suggestions_to_show(5).search_list(chromosomes).selection_function(search_select_chrom).placeholder(chromosomes[0]);
	d3.select("#chrom_livesearch").call(chrom_livesearch);

}

function chunk_changed() {

	// Show results only if there is anything to show
	if (_Chunk_alignments.length > 0) {

		all_read_analysis(); // calculates features of each alignment and adds these variables to _Chunk_alignments
		
		organize_references_for_chunk();

		show_all_chromosomes();
		apply_ref_filters();

		d3.select("#variant_input_panel").style("display","block");

		draw_region_view();
		
		_current_read_index = 0;
		select_read();

		var readname_livesearch = d3.livesearch().max_suggestions_to_show(5).search_list(_Chunk_alignments).search_key("readname").selection_function(search_select_read).placeholder(_Chunk_alignments[0].readname);
		d3.select("#readname_livesearch").call(readname_livesearch); 

	} else {
		_Alignments = [];
		_Chunk_ref_intervals = [];
		draw_region_view();
		user_message("","");
	}
	
	refresh_visibility();

}

function sam_input_changed(sam_input_value) {
		_settings.current_input_type = "sam";

		clear_data();
		clear_coords_input();
		remove_coords_file();
		remove_bam_file();

		var input_text = sam_input_value.split("\n");
		_Ref_sizes_from_header = {};
		_Chunk_alignments = [];
		var unique_readnames = {};
		_settings.min_indel_size = 100000000000; 

		for (var i = 0; i < input_text.length; i++) {
			var columns = input_text[i].split(/\s+/);
			if (columns[0][0] == "@") {
				if (columns[0].substr(0,3) == "@SQ") {
					_Ref_sizes_from_header[columns[1].split(":")[columns[1].split(":").length-1]] = parseInt(columns[2].split(":")[columns[2].split(":").length-1]);	
				}
			} else if (columns.length >= 3) {
				if (columns.length >= 6) {
					var parsed_line = parse_sam_coordinates(input_text[i]);
					if (parsed_line != undefined) {
						if (unique_readnames[parsed_line.readname] == undefined || _settings.keep_duplicate_reads) {
							_Chunk_alignments.push(parsed_line);
							unique_readnames[parsed_line.readname] = true;
						}
					}
				} else {
					user_message("Error","Lines from a sam file must have at least 6 columns, and must contain SA tags in order to show secondary/supplementary alignments.");
					return;
				}
			}
		}

		_focal_region = undefined;
		
		refresh_visibility();
		chunk_changed();
	
}

$('#sam_input').bind('input propertychange', function() {sam_input_changed(this.value)});

d3.select("#sam_info_icon").on("click", function() {
	var example = "forward 0  chr2  32866713  60  1000H1000M1000D1000M3000H\nreverse 16  chr2  32866713  60  3000H1000M1000D1000M1000H\nboth 0  chr2  32866713  60  1000H1000M1000D1000M3000H SA:Z:chr2,32866713,-,3000H1000M1000D1000M1000H,60,1;\nindels 0  chr2  32866713  60  100H100M100D100M50I100M40D10M30I100M300H";
	d3.select('#sam_input').property("value",example);
	sam_input_changed(example);
});


d3.select("#bam_info_icon").on("click", function() {
	user_message("Instructions","Create a bam file using an aligner such as BWA, BLASR, or NGM-LR. If you get a sam file convert it to a bam file: <pre>samtools view -bS my_file.sam > my_file.bam</pre>Next sort the bam file:<pre>samtools sort my_file.bam my_file.sorted</pre>Then index the sorted bam file: <pre>samtools index my_file.sorted.bam</pre>Finally, upload the my_file.sorted.bam and the my_file.sorted.bam.bai files");
});


d3.selectAll(".bed_info_icon").on("click", function() {
	user_message("Instructions","Paste or upload a bed file of variants or other features to look at. <p> Columns: </p><ol><li>chromosome (reference) </li><li>start position (reference)</li><li>end position (reference)</li><li>name (optional)</li><li>score (optional)</li><li>strand (optional)</li><li>type/category (optional)</li></ol> All optional fields can be used for filtering or showing tooltips with information, but only the first 3 columns are required for basic functionality.");
});


d3.selectAll(".vcf_info_icon").on("click", function() {
	user_message("Instructions","Paste or upload a vcf file of variants to look at. <p> Requirements: columns: </p><ol><li>chromosome (reference) </li><li> position (reference)</li><li>ID (optional)</li></ol> The 8th column may contain optional information including STRAND (+/-), TYPE or SVTYPE, and END (the end position where the 2nd column is the start). All optional fields can be used for filtering or showing tooltips with information, but only the first 2 columns are required for basic functionality.");
});



function parse_coords_columns(columns) {
	//     [S1]     [E1]  |     [S2]     [E2]  |  [LEN 1]  [LEN 2]  |  [% IDY]  |  [LEN R]  [LEN Q]  | [TAGS]
	// ==========================================================================================================
	// 38231172 38246777  | 242528828 242513174  |    15606    15655  |    97.69  | 133797422 249250621  | chr10       1

	var alignment = {
		r: columns[9],
		rs: parseInt(columns[0]),
		re: parseInt(columns[1]),
		qs: parseInt(columns[2]),
		qe: parseInt(columns[3]),
		mq: parseFloat(columns[6]),
		read_length: parseInt(columns[8]),
		max_indel: null // no indel in coordinates, disable the indel options upon null

	}
	alignment.aligned_length = Math.abs(alignment.qe - alignment.qs);

	alignment.path = [];
	alignment.path.push({"R":alignment.rs, "Q":alignment.qs});
	alignment.path.push({"R":alignment.re, "Q":alignment.qe});

	return alignment;
}


function coords_input_changed(coords_input_value) {
	_settings.current_input_type = "coords";

	clear_data();
	clear_sam_input();
	remove_bam_file();

	var input_text = coords_input_value.split("\n");
	_Ref_sizes_from_header = {};
	_settings.min_indel_size = 100000000000;

	var alignments_by_query = {};

	for (var i = 0; i < input_text.length; i++) {
		var columns = input_text[i].split(/\s+/);

		//     [S1]     [E1]  |     [S2]     [E2]  |  [LEN 1]  [LEN 2]  |  [% IDY]  |  [LEN R]  [LEN Q]  | [TAGS]
		// ==========================================================================================================
		// 38231172 38246777  | 242528828 242513174  |    15606    15655  |    97.69  | 133797422 249250621  | chr10       1

		if (columns.length == 11) {
			var readname = columns[10];
			if (alignments_by_query[readname] == undefined) {
				alignments_by_query[readname] = [];
			}
			alignments_by_query[readname].push(parse_coords_columns(columns));
			_Ref_sizes_from_header[columns[9]] = parseInt(columns[7]);
		} else if (columns.length < 3) {
			continue;
		} else if (columns.length != 11) {
			user_message("Error","The coordinates must be the same as MUMmer's show-coords -lTH. This means 11 tab-separated columns without a header: <ol><li>Ref start</li><li>Ref end</li><li>Query start</li><li>Query end</li><li>Ref alignment length</li><li>Query alignment length</li><li>Percent Identity</li><li>Total reference length</li><li>Total query length</li><li>Reference name(chromosome)</li><li>Query_name</li></ol>");
			refresh_visibility();
			return;
		}
	}

	_Chunk_alignments = [];
	for (var readname in alignments_by_query) {
		// {"alignments": alignments, "raw":line, "raw_type":"sam", "readname":fields[0]};
		_Chunk_alignments.push({
			"alignments": alignments_by_query[readname],
			"raw_type":"coords",
			"readname":readname
		});
	}


	_focal_region = undefined;
	
	refresh_visibility();
	chunk_changed();

}


$('#coords_input').bind('input propertychange', function() {remove_coords_file(); coords_input_changed(this.value)});


d3.select("#coords_info_icon").on("click", function() {
	var example = "1000 2000 3000 4000 0 0 97.69 3000 5000 chr5 read1";
	d3.select('#coords_input').property("value",example);
	coords_input_changed(example);
});


d3.select("select#read_sorting_dropdown").selectAll("option").data(_static.read_sort_options).enter()
	.append("option")
		.text(function(d){return d.description})
		.property("value",function(d){return d.id});

d3.select("select#read_sorting_dropdown").on("change",function(d) {
	_settings.feature_to_sort_reads = this.options[this.selectedIndex].value;
	draw_region_view();
});



d3.select("select#color_scheme_dropdown").selectAll("option").data(_static.color_schemes).enter()
	.append("option")
		.text(function(d){return d.name})
		.property("value",function(d){return d.colors});

d3.select("select#color_scheme_dropdown").on("change",function(d) {
	_settings.colors = _static.color_collections[this.options[this.selectedIndex].value];	
	_scales.ref_color_scale.range(_settings.colors);
	draw_region_view();
	draw();
});

function calculate_variant_categories() {
	var variant_types = {};
	for (var i in _Variants) {
		if (variant_types[_Variants[i].type] == undefined) {
			variant_types[_Variants[i].type] = 1;
		} else {
			variant_types[_Variants[i].type]++;
		}
	}
	var other_colors_index = 0;
	var colors_for_variants = [];
	var variant_names = [];
	for (var type in variant_types) {
		variant_names.push(type);
		if (type.toUpperCase().indexOf("DEL") != -1) {
			colors_for_variants.push("blue");	
		} else if (type.toUpperCase().indexOf("INS") != -1) {
			colors_for_variants.push("red");
		} else if (type.toUpperCase().indexOf("INV") != -1) {
			colors_for_variants.push("orange");
		} else if (type.toUpperCase().indexOf("TRA") != -1) {
			colors_for_variants.push("purple");	
		} else if (type.toUpperCase().indexOf("BND") != -1) {
			colors_for_variants.push("purple");	
		} else if (type.toUpperCase().indexOf("DUP") != -1) {
			colors_for_variants.push("green");	
		} else if (variant_types[type] > 1) {
			colors_for_variants.push(_static.color_collections[2][other_colors_index])
			other_colors_index++;
		} else {
			colors_for_variants.push("#eeeeee");
		}
	}

	_scales.variant_color_scale.domain(variant_names).range(colors_for_variants);
}

function variant_row_click(d) {
	go_to_region(d.chrom,(d.start+d.end)/2,(d.start+d.end)/2+1);
}

function check_bam_done_fetching() {
	if (_loading_bam_right_now == true) {
		return false;
	} else {
		return true;
	}
}

function show_variant_table() {
	d3.select("#variant_table_panel").style("display","block");
	
	d3.select("#variant_table_landing").call(
		d3.superTable()
			.table_data(_Variants)
			.num_rows_to_show(15)
			.show_advanced_filters(true)
			.click_function(variant_row_click)
			.check_ready_function(check_bam_done_fetching)
	);
	d3.select(".d3-superTable-table").selectAll("input").on("focus",function() {
		console.log("hello");
		user_message("Instructions","Filter table on each column by typing for instance =17 to get all rows where that column is 17, you can also do >9000 or <9000. Separate multiple filters in the same column with spaces.");
	});

}


function bed_input_changed(bed_input) {
	var input_text = bed_input.split("\n");
	
	_Variants = [];
	for (var i in input_text) {
		var columns = input_text[i].split(/\s+/);
		if (columns.length>2) {
			var start = parseInt(columns[1]);
			var end = parseInt(columns[2]);
			var score = parseFloat(columns[4]);
			if (isNaN(score)) {
				score = 0;
			}
			if (isNaN(start) || isNaN(end)) {
				user_message("Error","Bed file must contain numbers in columns 2 and 3. Found: <pre>" + columns[1] + " and " + columns[2] + "</pre>.");
				return;
			}
			_Variants.push({"chrom":columns[0],"start":start, "end":end, "size": end - start, "name":columns[3] || "", "score":score ,"strand":columns[5],"type":columns[6] || ""});
		}
	}

	user_message("Info","Loaded " + _Variants.length + " bed entries");
	
	clear_vcf_input();
	update_variants();
	
}
function update_variants() {
	calculate_variant_categories()
	show_variant_table();
	draw_region_view();
}

$('#bed_input').bind('input propertychange', function() {remove_variant_file(); bed_input_changed(this.value)});


function vcf_input_changed(vcf_input) {
	var input_text = vcf_input.split("\n");
	
	_Variants = [];
	for (var i in input_text) {
		if (input_text[i][0] != "#") {
			var columns = input_text[i].split(/\s+/);
			if (columns.length>=3) {
				var start = parseInt(columns[1]);
				var end = start;
				var type = "";
				var strand = "";
				var score = parseFloat(columns[4]);
				if (isNaN(score)) {
					score = 0;
				}
				if (isNaN(start) || isNaN(end)) {
					user_message("Error","VCF file must contain a number in column 2. Found: <pre>" + columns[1] + "</pre>.");
					return;
				}
				if (columns[7] != undefined) {
					var info_fields = columns[7].split(";");
					for (var field in info_fields) {
						var info = info_fields[field].split("=");
						if (info.length == 2) {
							if (info[0] == "END") {
								end = parseInt(info[1]);
							} else if (info[0] == "TYPE" || info[0] == "SVTYPE") {
								type = info[1];
							} else if (info[0] == "STRAND") {
								strand = info[1];
							}
						}
					}
				}
				_Variants.push({"chrom":columns[0],"start":start, "end":end, "size": end - start, "name":columns[2], "score":score,"strand":strand,"type":type});
			}
		}
	}

	user_message("Info","Loaded " + _Variants.length + " vcf entries");
	clear_bed_input();
	update_variants();
}


$('#vcf_input').bind('input propertychange', function() {remove_variant_file(); vcf_input_changed(this.value)});

function remove_variant_file() {
	// For when sam input or coords text input changes, clear bam file to prevent confusion and enable switching back to the bam file
	d3.select('#variant_file').property("value","");
}


function run() {
	responsive_sizing();
	refresh_visibility();
}

function dict_length(dictionary) {
	var num = 0;
	for (var k in dictionary) {num++;}
	return num;
}

function all_read_analysis() {
	
	var overall_max_mq = 0;
	var overall_min_mq = 100000000;
	var overall_max_num_alignments = 0;
	var max_readlength = 0;

	for (var j in _Chunk_alignments) {
		var read_record = _Chunk_alignments[j];
		_Chunk_alignments[j].index = j;
		// var all_chrs = {};
		var max_mq = 0;
		var min_mq = 10000000;
		if (read_record.alignments[0].read_length > max_readlength) {
			max_readlength = read_record.alignments[0].read_length;
		}

		// var min_mq = 100000;
		for (var i in read_record.alignments) {
			if (read_record.alignments[i].mq > max_mq) {
				max_mq = read_record.alignments[i].mq;
			}
			if (read_record.alignments[i].mq < min_mq) {
				min_mq = read_record.alignments[i].mq;
			}

			// all_chrs[read_record.alignments[i].r] = true;
		}
		_Chunk_alignments[j].max_mq = max_mq;
		if (max_mq > overall_max_mq) {
			overall_max_mq = max_mq;
		}
		if (min_mq < overall_min_mq) {
			overall_min_mq = min_mq;
		}

		if (_Chunk_alignments[j].alignments.length > overall_max_num_alignments) {
			overall_max_num_alignments = _Chunk_alignments[j].alignments.length;
		}
	}

	_ui_properties.region_mq_slider_max = overall_max_mq; 
	_ui_properties.region_mq_slider_min = overall_min_mq; 
	_ui_properties.num_alignments_slider_max = overall_max_num_alignments; 
	_ui_properties.read_length_slider_max = max_readlength;


	_settings.max_num_alignments = overall_max_num_alignments;
	_settings.min_num_alignments = 1;
	_settings.region_min_mapping_quality = overall_min_mq;
	_settings.min_mapping_quality = overall_min_mq;
	_settings.min_indel_size = 1000000;
	_settings.min_align_length = 0;
	_settings.min_aligns_for_ref_interval_slider = 0;
	_settings.min_read_length = 0;
}

function refresh_ui_elements() {

	if (_settings.current_input_type == "coords") {
		$("#min_mq_title").html("Minimum % identity: ");
		$('#mq_slider').slider("option","step", 0.01);
		$("#region_min_mq_title").html("Minimum % identity of best alignment:");
		$('#region_mq_slider').slider("option","step", 0.01);

		d3.selectAll(".hide_for_coords").style("color","#dddddd");
		// Disable indel size slider
		$("#indel_size_slider").slider("option","disabled",true);

		// Disable header refs only checkbox
		$("#only_header_refs_checkbox").attr("disabled",true);
		
	} else if (_settings.current_input_type == "sam" || _settings.current_input_type == "bam") {
		$("#min_mq_title").html("Minimum mapping quality: ");
		$('#mq_slider').slider("option","step", 1);
		$("#region_min_mq_title").html("Minimum mapping quality of best alignment:");
		$('#region_mq_slider').slider("option","step", 1);
		
		d3.selectAll(".hide_for_coords").style("color","black");
		// Enable indel size slider
		$("#indel_size_slider").slider("option","disabled",false);

		// Enable header refs only checkbox
		$("#only_header_refs_checkbox").attr("disabled",false);
	}

	// Mapping quality in region view
	$('#region_mq_slider').slider("option","max", _ui_properties.region_mq_slider_max);
	$('#region_mq_slider').slider("option","min", _ui_properties.region_mq_slider_min);
	$('#region_mq_slider').slider("option","value", _settings.region_min_mapping_quality);
	$("#region_mq_label").html(_settings.region_min_mapping_quality);

	$('#max_ref_length_slider').slider("option","max", _ui_properties.ref_length_slider_max);
	$('#max_ref_length_slider').slider("option","value", _settings.max_ref_length);
	d3.select("#max_ref_length_input").property("value",_settings.max_ref_length);

	
	$('#min_read_length_slider').slider("option","max", _ui_properties.read_length_slider_max);
	$('#min_read_length_slider').slider("option","value", _settings.min_read_length);
	d3.select("#min_read_length_input").property("value", _settings.min_read_length);

	// Number of alignments for reference intervals:
	d3.select("#min_aligns_for_ref_interval_slider").property("value", _settings.min_read_length);

	// Number of alignments in region view
	$( "#num_aligns_range_slider" ).slider("option","max",_ui_properties.num_alignments_slider_max);
	$( "#num_aligns_range_slider" ).slider("values",0,_settings.min_num_alignments);
	$( "#num_aligns_range_slider" ).slider("values",1,_settings.max_num_alignments);
	$( "#num_aligns_range_label" ).html( "" + _settings.min_num_alignments + " - " + _settings.max_num_alignments );


	// Mapping quality in read detail view
	$('#mq_slider').slider("option","max", _ui_properties.mq_slider_max);
	$('#mq_slider').slider("option","min", _ui_properties.region_mq_slider_min);
	$('#mq_slider').slider("option","value", _settings.min_mapping_quality);
	$("#mq_label").html(_settings.min_mapping_quality);


	// Indel size in read detail view
	$('#indel_size_slider').slider("option","max", _ui_properties.indel_size_slider_max+1);
	$('#indel_size_slider').slider("option","value", _settings.min_indel_size);
	$("#indel_size_label").html(_settings.min_indel_size);

	// Alignment length in read detail view
	$('#align_length_slider').slider("option","max", _ui_properties.align_length_slider_max);
	$('#align_length_slider').slider("option","value", _settings.min_align_length);
	$("#align_length_label").html(_settings.min_align_length);
}

function parse_cigar(cigar_string) {
	// console.log(cigar_string);
	var cigar_regex = /(\d+)(\D)/;
	var parsed = cigar_string.split(cigar_regex);
	if (parsed.length < 2) {
		user_message("Error","This doesn't look like a sam file. The 6th column must be a valid cigar string.");
		throw("input error: not a valid cigar string");
	}
	// console.log(parsed);
	var results = [];
	for (var i = 0; i < parsed.length; i++) {
		if (parsed[i] != "") {
			results.push(parsed[i]);
		}
	}
	var output = [];
	for (var i = 0; i < results.length-1; i+=2) {
		output.push({"num":parseInt(results[i]), "type":results[i+1]});
	}
	// console.log(output);
	return output;
}


function parse_SA_field(sa) {
	var alignments = [];
	var aligns = sa.split(";");
	for (var i = 0; i < aligns.length; i++) {
		var fields = aligns[i].split(",");
		if (fields.length >= 6) {
			var chrom = fields[0];
			var rstart = parseInt(fields[1]);
			var raw_cigar = fields[3];
			var strand = fields[2];
			var mq = parseInt(fields[4]);

			alignments.push(read_cigar(raw_cigar,chrom,rstart,strand,mq));

		} else if (fields.length > 1) {
			console.log("ignoring alternate alignment because it doesn't have all 6 columns:");
			console.log(fields);
		}
	}

	return alignments;
}

function user_message(message_type,message) {
	if (message_type == "") {
		d3.select("#user_message").html("").style("display","none");
	} else {
		d3.select("#user_message").style("display","block");
		var message_style = "default";
		switch (message_type) {
			case "error":
				message_style="danger";
				break;
			case "Error":
				message_style="danger";
				break;
			case "warning","Warning":
				message_style="warning";
				break;
			default:
				message_style="info";
		}
		d3.select("#user_message").html("<strong>"+ message_type + ": </strong>" + message).attr("class","alert alert-" + message_style);
	}
}

function cigar_coords(cigar) {
	// cigar must already be parsed using parse_cigar()
	
	var coords = {};
	coords.read_alignment_length = 0;
	coords.ref_alignment_length = 0;
	
	coords.front_padding_length = 0; // captures S/H clipping at the beginning of the cigar string (what the ref considers the start location)
	coords.end_padding_length = 0; // captures S/H clipping at the end of the cigar string (what the ref considers the end location)

	for (var i = 0; i < cigar.length; i++) {
		var num = cigar[i].num;
		switch (cigar[i].type) {
			case "H":
				if (i < 2) {
					coords.front_padding_length += num;
				} else if (i > cigar.length - 3) {
					coords.end_padding_length += num;
				}
				break;
			case "S":
				if (i < 2) {
					coords.front_padding_length += num;
				} else if (i > cigar.length - 3) {
					coords.end_padding_length += num;
				}
				break;
			case "M":
				coords.read_alignment_length += num;
				coords.ref_alignment_length += num;
				break;
			case "=":
				coords.read_alignment_length += num;
				coords.ref_alignment_length += num;
				break;
			case "X":
				coords.read_alignment_length += num;
				coords.ref_alignment_length += num;
				break;
			case "I":
				coords.read_alignment_length += num;
				break;
			case "D":
				coords.ref_alignment_length += num;
				break;
			case "N": // "Skipped region from the reference" -- sam format specification
				coords.ref_alignment_length += num; 
				break;
			case "P": // "Padding: silent deletion from padded reference" -- sam format specification
				coords.ref_alignment_length += num;
				break;
			default:
				console.log("Don't recognize cigar character: ", cigar[i].type, ", assuming it advances both query and reference, like a match or mismatch");
				coords.read_alignment_length += num;
				coords.ref_alignment_length += num;
		}
	}
	return coords;
}
function read_cigar(unparsed_cigar,chrom,rstart,strand,mq) {
	var cigar = parse_cigar(unparsed_cigar);


	//////   Read cigar string for 
	var coordinates = cigar_coords(cigar);

	var alignment = {};
	alignment.r = chrom;
	alignment.rs = rstart;
	alignment.re = rstart + coordinates.ref_alignment_length;
	
	if (strand == "+") {
		alignment.qs = coordinates.front_padding_length;
		alignment.qe = coordinates.front_padding_length + coordinates.read_alignment_length;
	} else {
		alignment.qe = coordinates.end_padding_length;
		alignment.qs = coordinates.end_padding_length + coordinates.read_alignment_length;
	}
	
	alignment.read_length = coordinates.front_padding_length + coordinates.read_alignment_length + coordinates.end_padding_length;
	alignment.mq = mq;
	alignment.max_indel = 0;
	alignment.aligned_length = coordinates.read_alignment_length;

	/////////     Now we run through the cigar string to capture the features     //////////
	alignment.path = [];
	// Add start coordinate to path before we begin
	alignment.path.push({"R":alignment.rs, "Q":alignment.qs});

	// Running counters of read and reference positions:
	var read_pos = 0;
	var step = 1;
	if (strand == "-") {
		read_pos = alignment.read_length; // start at the end of the cigar string
		step = -1; // move backwards towards the front of the cigar string
	}
	var ref_pos = rstart;

	for (var i = 0; i < cigar.length; i++) {
		var num = cigar[i].num;
		switch (cigar[i].type) {
			case "H":
			case "S":
				read_pos += step*num;
				break;
			case "M":
			case "=":
			case "X":
				read_pos += step*num;
				ref_pos += num;
				break;
			case "I":
				if (_settings.min_indel_size != -1 && num >= _settings.min_indel_size) {
					alignment.path.push({"R":ref_pos, "Q":read_pos});
					alignment.path.push({"R":ref_pos, "Q":read_pos + step*num});
				}
				if (num > alignment.max_indel) {
					alignment.max_indel = num;
				}
				read_pos += step*num;
				break;
			case "D":
				if (_settings.min_indel_size != -1 && num >= _settings.min_indel_size) {
					alignment.path.push({"R":ref_pos, "Q":read_pos});
					alignment.path.push({"R":ref_pos + num, "Q":read_pos});
				}
				if (num > alignment.max_indel) {
					alignment.max_indel = num;
				}
				ref_pos += num;
				break;
			case "N": // "Skipped region from the reference" -- sam format specification
			case "P": // "Padding: silent deletion from padded reference" -- sam format specification
				ref_pos += num;
				break;
			default:
				console.log("Don't recognize cigar character: ", cigar[i].type, ", assuming it advances both query and reference, like a match or mismatch");
				read_pos += step*num;
				ref_pos += num;
		}
	}

	// alignment.max_indel
	alignment.path.push({"R":alignment.re, "Q":alignment.qe});
	return alignment;
}

function parse_sam_coordinates(line) {
	var fields = line.split(/\s+/);

	var chrom = fields[2];
	var rstart = parseInt(fields[3]);
	var flag = parseInt(fields[1]);
	var mq = parseInt(fields[4]);
	var raw_cigar = fields[5];
	if (raw_cigar == "*") {
		return undefined;
	}
	
	var strand = "+";
	if ((flag & 16) == 16) {
		strand = "-";
	}
	
	var alignments = [];
	for (var i = 0; i < fields.length; i++) {
		if (fields[i].substr(0,2) == "SA") {
			alignments = parse_SA_field(fields[i].split(":")[2]);
		}
	}

	alignments.push(read_cigar(raw_cigar,chrom,rstart,strand,mq));

	var read_length = alignments[alignments.length-1].read_length;

	for (var i = 0; i < alignments.length; i++) {
		 if (alignments[i].read_length != read_length) {
				user_message("Warning", "read length of primary and supplementary alignments do not match for this read (calculated using cigar strings)");
		 }
	}

	return {"alignments": alignments, "raw":line, "raw_type":"sam", "readname":fields[0]};
}

function planesweep_consolidate_intervals(starts_and_stops) {
	
	// Add margin to the stop points
	for (var i = 0; i < starts_and_stops.length; i++) {
		if (starts_and_stops[i][1] == "e") {
			starts_and_stops[i][0] = starts_and_stops[i][0]+_static.margin_to_merge_ref_intervals;
		}
	}
	
	starts_and_stops.sort(function(a, b){return a[0]-b[0]});

	var intervals = [];
	var coverage = 0;
	var alignment_count = 0;
	var most_recent_start = -1;
	for (var i = 0; i < starts_and_stops.length; i++) {
		if (starts_and_stops[i][1]=="s") {
			coverage++;
			alignment_count++;
			if (coverage == 1) { // coverage was 0, now starting new interval
				most_recent_start = starts_and_stops[i][0];
			}
		} else if (starts_and_stops[i][1]=="e") {
			coverage--;
			if (coverage == 0) { // coverage just became 0, ending current interval
				// Remove margin from the final stop point before recording, avoiding margins on the edges of the intervals
				intervals.push([most_recent_start, starts_and_stops[i][0]-_static.margin_to_merge_ref_intervals, alignment_count]);
				alignment_count = 0; // reset
			}
		} else {
			console.log("ERROR: unrecognized code in planesweep_consolidate_intervals must be s or e");
		}
	}

	return intervals;
}

function reparse_read(record_from_chunk) {
	if (record_from_chunk.raw_type == "sam") {
		return parse_sam_coordinates(record_from_chunk.raw);
	} else if (record_from_chunk.raw_type == "bam") {
		return parse_bam_record(record_from_chunk.raw);
	} else if (record_from_chunk.raw_type == "coords") {
		return record_from_chunk; // no indels
	} else {
		console.log("Don't recognize record_from_chunk.raw_type, must be sam or bam");
	}
}


function select_read() {
	var readname = _Chunk_alignments[_current_read_index].readname;

	user_message("","");

	// Show read info
	

	d3.select("#text_output").html("Read name: " + _Chunk_alignments[_current_read_index].readname + "<br>Number of alignments: " + _Chunk_alignments[_current_read_index].alignments.length);
	

	// d3.select("#text_output").property("value","Read name: " + _Chunk_alignments[_current_read_index].readname + "\n" + "Number of alignments: " + _Chunk_alignments[_current_read_index].alignments.length );

	//  + "\n" + "Number of alignments: " + _Chunk_alignments[_current_read_index].alignments.length

	_settings.min_indel_size = 1000000000; // parse alignments for new read first without indels
	_Alignments = reparse_read(_Chunk_alignments[_current_read_index]).alignments;
	
	_ui_properties.mq_slider_max = 0;
	_ui_properties.indel_size_slider_max = 0;
	_ui_properties.align_length_slider_max = 0; 
	for (var i in _Alignments) {
		var alignment = _Alignments[i];
		if (alignment.mq > _ui_properties.mq_slider_max) {
			_ui_properties.mq_slider_max = alignment.mq;
		}
		if (alignment.max_indel > _ui_properties.indel_size_slider_max) {
			_ui_properties.indel_size_slider_max = alignment.max_indel;
		}
		if (alignment.aligned_length > _ui_properties.align_length_slider_max) {
			_ui_properties.align_length_slider_max = alignment.aligned_length;
		}
	}

	_settings.min_align_length = 0;
	_settings.min_indel_size = _ui_properties.indel_size_slider_max + 1;

	organize_references_for_read();

	_scales.read_scale.domain([0,_Alignments[_Alignments.length-1].read_length]);


	refresh_visibility();
	refresh_ui_elements();
	draw();
}

// Natural sort is from: http://web.archive.org/web/20130826203933/http://my.opera.com/GreyWyvern/blog/show.dml/1671288
function natural_sort(a, b) {
	function chunk(t) {
		var tz = [], x = 0, y = -1, n = 0, i, j;

		while (i = (j = t.charAt(x++)).charCodeAt(0)) {
			var m = (i == 46 || (i >=48 && i <= 57));
			if (m !== n) {
				tz[++y] = "";
				n = m;
			}
			tz[y] += j;
		}
		return tz;
	}

	var aa = chunk(a);
	var bb = chunk(b);

	for (x = 0; aa[x] && bb[x]; x++) {
		if (aa[x] !== bb[x]) {
			var c = Number(aa[x]), d = Number(bb[x]);
			if (c == aa[x] && d == bb[x]) {
				return c - d;
			} else return (aa[x] > bb[x]) ? 1 : -1;
		}
	}
	return aa.length - bb.length;
}

function ribbon_alignment_path_generator(d) {

	var bottom_y = _positions.read.y;

	var top_y = _positions.ref_intervals.y + _positions.ref_intervals.height;
	
	var output = "M " + _scales.ref_interval_scale(map_ref_interval(d.r,d.path[0].R)) + "," + top_y; // ref start
	output += ", L " + _scales.read_scale(d.path[0].Q)      + "," + bottom_y; // read start

	for (var i = 1; i < d.path.length; i++) {
		var ref_coord = ", L " + _scales.ref_interval_scale(map_ref_interval(d.r,d.path[i].R))      + "," + top_y; // ref 
		var read_coord = ", L " + _scales.read_scale(d.path[i].Q)      															+ "," + bottom_y; // read 
		if (i % 2 == 0) { // alternate reference and read side so top goes to top
			output += ref_coord + read_coord;
		} else {
			output += read_coord + ref_coord;
		}
	}
	
	output += ", L " + _scales.ref_interval_scale(map_ref_interval(d.r,d.path[0].R)) + "," + top_y; // ref start
	output += ", L " + _scales.read_scale(d.path[0].Q)      + "," + bottom_y; // read start

	return output;
}

function ref_mapping_path_generator(d,chunk) {

		var bottom = {};
		var top = {};

		if (chunk == true) {
			bottom.y = _positions.chunk.ref_intervals.y;		
			bottom.left = _scales.chunk_ref_interval_scale(d.cum_pos);
			bottom.right = bottom.left + _scales.chunk_ref_interval_scale(d.end)-_scales.chunk_ref_interval_scale(d.start);
			
			top.y = _positions.chunk.ref_block.y + _positions.chunk.ref_block.height;
			top.left = _scales.chunk_whole_ref_scale(map_chunk_whole_ref(d.chrom,d.start));
			top.right = _scales.chunk_whole_ref_scale(map_chunk_whole_ref(d.chrom,d.end));
		} else {
			bottom.y = _positions.ref_intervals.y;			
			bottom.left = _scales.ref_interval_scale(d.cum_pos);
			bottom.right = bottom.left + _scales.ref_interval_scale(d.end)-_scales.ref_interval_scale(d.start);
			
			top.y = _positions.ref_block.y + _positions.ref_block.height;
			top.left = _scales.whole_ref_scale(map_whole_ref(d.chrom,d.start));
			top.right = _scales.whole_ref_scale(map_whole_ref(d.chrom,d.end));
		}
		
		

		return (
				 "M " + bottom.left                          + "," + bottom.y
		 + ", L " + bottom.right                          + "," + bottom.y
		 + ", L " + top.right                           + "," + top.y
		 + ", L " + top.left                           + "," + top.y
		 + ", L " + bottom.left                          + "," + bottom.y
		 )
}

function map_whole_ref(chrom,position) {
	// _Whole_refs has chrom, size, cum_pos

	for (var i = 0; i < _Whole_refs.length; i++) {
		if (_Whole_refs[i].chrom == chrom) {
			return _Whole_refs[i].cum_pos + position;
		}
	}
	return undefined;
}
function map_chunk_whole_ref(chrom,position) {
	// _Whole_refs has chrom, size, cum_pos

	for (var i = 0; i < _Whole_refs.length; i++) {
		if (_Whole_refs[i].chrom == chrom) {
			return _Whole_refs[i].filtered_cum_pos + position;
		}
	}
	return undefined;
}


function map_ref_interval(chrom,position) {
	// _Ref_intervals has chrom, start, end, size, cum_pos
	for (var i = 0; i < _Ref_intervals.length; i++) {
		if (_Ref_intervals[i].chrom == chrom) {
			if (position >= _Ref_intervals[i].start && position <= _Ref_intervals[i].end ) {
				return _Ref_intervals[i].cum_pos + (position - _Ref_intervals[i].start);
			}
		}
	}
	console.log("ERROR: no chrom,pos match found in map_ref_interval()");
	console.log(chrom,position);
	console.log(_Ref_intervals);

}


function closest_map_chunk_ref_interval(chrom,position) {
	// _Ref_intervals has chrom, start, end, size, cum_pos
	var closest = 0;
	var best_distance = -1;
	for (var i in _Chunk_ref_intervals) {
		if (_Chunk_ref_intervals[i].chrom == chrom) {
			if (position >= _Chunk_ref_intervals[i].start && position <= _Chunk_ref_intervals[i].end ) {
				return {"precision":"exact","pos": _Chunk_ref_intervals[i].cum_pos + (position - _Chunk_ref_intervals[i].start)};
			}
			if (Math.abs(position - _Chunk_ref_intervals[i].start) < best_distance || best_distance == -1) {
				closest = _Chunk_ref_intervals[i].cum_pos;
				best_distance = Math.abs(position - _Chunk_ref_intervals[i].start);
			}
			if (Math.abs(position - _Chunk_ref_intervals[i].end) < best_distance) {
				closest = _Chunk_ref_intervals[i].cum_pos + _Chunk_ref_intervals[i].end - _Chunk_ref_intervals[i].start;
				best_distance = Math.abs(position - _Chunk_ref_intervals[i].end);
			}
		}
	}

	// If no exact match found by the end, return the closest
	return {"precision":"inexact","pos": closest};
	
}

function map_chunk_ref_interval(chrom,position) {
	// _Ref_intervals has chrom, start, end, size, cum_pos
	for (var i = 0; i < _Chunk_ref_intervals.length; i++) {
		if (_Chunk_ref_intervals[i].chrom == chrom) {
			if (_Chunk_ref_intervals[i].cum_pos != -1 && position >= _Chunk_ref_intervals[i].start && position <= _Chunk_ref_intervals[i].end ) {
				return _Chunk_ref_intervals[i].cum_pos + (position - _Chunk_ref_intervals[i].start);
			}
		}
	}
	return false;
	console.log("ERROR: no chrom,pos match found in map_chunk_ref_interval()");
	console.log(chrom,position);
	console.log(_Chunk_ref_intervals);
}

function get_chromosome_sizes(ref_intervals_by_chrom) {

	var chromosomes = [];
	for (var chrom in ref_intervals_by_chrom) {
		chromosomes.push(chrom);
	}
	for (var chrom in _Ref_sizes_from_header) {
		if (chromosomes.indexOf(chrom) == -1) {
			chromosomes.push(chrom);
		}
	}

	chromosomes.sort(natural_sort);

	_ui_properties.ref_length_slider_max = 0;


	_Whole_refs = [];
	var cumulative_whole_ref_size = 0;
	for (var j = 0; j < chromosomes.length; j++){
		var chrom = chromosomes[j];
		var intervals = ref_intervals_by_chrom[chrom];
		var new_ref_data = undefined;
		if (_Ref_sizes_from_header[chrom] == undefined) {
			var length_guess = intervals[intervals.length-1][1]*2;
			if (!_settings.show_only_known_references) {
				new_ref_data = {"chrom":chrom,"size":length_guess,"cum_pos":cumulative_whole_ref_size};
				// cumulative_whole_ref_size += length_guess;
			}
		} else {
			new_ref_data = {"chrom":chrom, "size":_Ref_sizes_from_header[chrom], "cum_pos":cumulative_whole_ref_size};
			// cumulative_whole_ref_size += _Ref_sizes_from_header[chrom];
		}

		if (new_ref_data != undefined) {
			if (new_ref_data.size > _ui_properties.ref_length_slider_max) {
				_ui_properties.ref_length_slider_max = new_ref_data.size;
			}
			_Whole_refs.push(new_ref_data);
			cumulative_whole_ref_size += new_ref_data.size;
		}
	}
	
	_settings.max_ref_length = _ui_properties.ref_length_slider_max;

	_scales.whole_ref_scale.domain([0,cumulative_whole_ref_size]);
	_scales.ref_color_scale.domain(chromosomes);
}

function ref_intervals_from_ref_pieces(ref_pieces) {
	// For each chromosome, consolidate intervals
	var ref_intervals_by_chrom = {};
	for (var chrom in ref_pieces) {
		ref_intervals_by_chrom[chrom] = planesweep_consolidate_intervals(ref_pieces[chrom]);
		
		if (_Ref_sizes_from_header[chrom] != undefined) {
			var chrom_sum = 0;
			var chrom_sum_num_alignments = 0;
			for (var i in ref_intervals_by_chrom[chrom]) {
				chrom_sum += (ref_intervals_by_chrom[chrom][i][1]-ref_intervals_by_chrom[chrom][i][0]);
				chrom_sum_num_alignments += ref_intervals_by_chrom[chrom][i][2];
			}
			// console.log(chrom_sum*1.0/_Ref_sizes_from_header[chrom]);
			if (chrom_sum*1.0/_Ref_sizes_from_header[chrom] > _static.fraction_ref_to_show_whole) {
				// console.log(ref_intervals_by_chrom[chrom]);
				ref_intervals_by_chrom[chrom] = [[0, _Ref_sizes_from_header[chrom], chrom_sum_num_alignments]];
			}	
		}
	}
	return ref_intervals_by_chrom;
}
function organize_references_for_chunk() {
	////////////////   Select reference chromosomes to show:   ////////////////////
	// Gather starts and ends for each chromosome
	var ref_pieces = {};
	for (var j = 0; j < _Chunk_alignments.length; j++) {
		alignments = _Chunk_alignments[j].alignments;
		for (var i = 0; i < alignments.length; i++) {
			if (ref_pieces[alignments[i].r] == undefined) {
				ref_pieces[alignments[i].r] = [];
			}
			var interval = [alignments[i].rs,alignments[i].re];
			
			ref_pieces[alignments[i].r].push([Math.min.apply(null,interval),"s"]);
			ref_pieces[alignments[i].r].push([Math.max.apply(null,interval),"e"]);
		}
	}
	
	// If a focal region was specified from querying the bam file, be sure to include it
	if (_focal_region != undefined) {
		if (ref_pieces[_focal_region.chrom] == undefined) {
			ref_pieces[_focal_region.chrom] = [];
		}
		ref_pieces[_focal_region.chrom].push([_focal_region.start,"s"]);
		ref_pieces[_focal_region.chrom].push([_focal_region.end,"e"]);
	}

	var ref_intervals_by_chrom = ref_intervals_from_ref_pieces(ref_pieces);

	//////////////////////////////////////////////////////////
	get_chromosome_sizes(ref_intervals_by_chrom);

	var chromosomes = [];
	for (var chrom in ref_intervals_by_chrom) {
		chromosomes.push(chrom);
	}

	chromosomes.sort(natural_sort);

	// var longest_region = {};
	// var length_of_longest_region = 0;

	_Chunk_ref_intervals = [];
	var cumulative_position = 0;
	for (var j = 0; j < chromosomes.length; j++){
		var chrom = chromosomes[j];
		var intervals = ref_intervals_by_chrom[chrom];
		for (var i in intervals) {
			_Chunk_ref_intervals.push({"chrom":chrom,"start":intervals[i][0],"end":intervals[i][1],"size":intervals[i][1]-intervals[i][0],"cum_pos":cumulative_position,"num_alignments":intervals[i][2]});
			var region_length = intervals[i][1]-intervals[i][0];
			cumulative_position += region_length;
			// if (region_length > length_of_longest_region) {
			// 	length_of_longest_region = region_length;
			// 	longest_region = {"chrom":chrom,"start":intervals[i][0],"end":intervals[i][1]};
			// }
		}
	}

	// if (_focal_region == undefined) {
	// 	_focal_region = longest_region;	
	// }


	_scales.chunk_ref_interval_scale.domain([0,cumulative_position]);

	refresh_visibility();
}


function organize_references_for_read() {
	////////////////   Select reference chromosomes to show:   ////////////////////
	// Gather starts and ends for each chromosome
	var ref_pieces = {};
	for (var i = 0; i < _Alignments.length; i++) {
		if (ref_pieces[_Alignments[i].r] == undefined) {
			ref_pieces[_Alignments[i].r] = [];
		}
		var interval = [_Alignments[i].rs,_Alignments[i].re];

		ref_pieces[_Alignments[i].r].push([Math.min.apply(null,interval),"s"]);
		ref_pieces[_Alignments[i].r].push([Math.max.apply(null,interval),"e"]);
	}

	// For each chromosome, consolidate intervals
	var ref_intervals_by_chrom = ref_intervals_from_ref_pieces(ref_pieces);


	var chromosomes = [];
	for (var chrom in ref_intervals_by_chrom) {
		chromosomes.push(chrom);
	}

	chromosomes.sort(natural_sort);

	_Ref_intervals = [];
	var cumulative_position = 0;
	for (var j = 0; j < chromosomes.length; j++){
		var chrom = chromosomes[j];
		var intervals = ref_intervals_by_chrom[chrom];
		for (var i = 0; i < intervals.length; i++) {
			_Ref_intervals.push({"chrom":chrom,"start":intervals[i][0],"end":intervals[i][1],"size":intervals[i][1]-intervals[i][0],"cum_pos":cumulative_position});
			cumulative_position += (intervals[i][1]-intervals[i][0]);
		}
	}

	_scales.ref_interval_scale.domain([0,cumulative_position]);
}



function refresh_visibility() {

	if (_Whole_refs.length > 0 || _Chunk_alignments.length > 0) {
		d3.select("#svg2_panel").style('visibility','visible');
	} else {
		d3.select("#svg2_panel").style('visibility','hidden');
	}

	if (_Chunk_alignments.length > 0) {
		d3.select("#region_settings_panel").style("display","block");
	} else {
		d3.select("#region_settings_panel").style("display","none");
	}

	if (_Alignments.length > 0) {
		d3.select("#settings").style('visibility','visible');
		d3.select("#svg1_panel").style('visibility','visible');
	} else {
		d3.select("#settings").style('visibility','hidden');
		d3.select("#svg1_panel").style('visibility','hidden');
	}
}

function draw() {
	if (_Alignments.length == 0) {
		// console.log("no alignments, not drawing anything");
		return;
	}
	if (_settings.ribbon_vs_dotplot == "dotplot") {
		draw_dotplot();
	} else {
		draw_ribbons();
	}
}

function reset_svg2() {
	////////  Clear the svg to start drawing from scratch  ////////
	d3.select("#svg2_panel").selectAll("svg").remove();

	_svg2 = d3.select("#svg2_panel").append("svg")
		.attr("width",_layout.svg2_width)
		.attr("height",_layout.svg2_height);

	d3.select("#svg2_panel").style('visibility','visible');
}


function reset_svg() {
	////////  Clear the svg to start drawing from scratch  ////////
	d3.select("#svg1_panel").selectAll("svg").remove();

	_svg = d3.select("#svg1_panel").append("svg")
		.attr("width",_layout.svg_width)
		.attr("height",_layout.svg_height);
}

function dotplot_alignment_path_generator(d) {
	var output = "M " + _scales.ref_interval_scale(map_ref_interval(d.r,d.path[0].R)) + "," + _scales.read_scale(d.path[0].Q);
	for (var i = 1; i < d.path.length; i++) {
		output += ", L " + _scales.ref_interval_scale(map_ref_interval(d.r,d.path[i].R)) + "," + _scales.read_scale(d.path[i].Q);		
	}
	
	return output;
}

function draw_dotplot() {
	reset_svg();

	if (_Alignments == undefined || _Alignments == []) {
		return;
	}

	// Make square
	var square = Math.min(_layout.svg_height,_layout.svg_width);

	_positions.fractions = {'main':0.8,'top_right':0.05, 'bottom_left':0.15};
	_positions.padding = {"top": square * _positions.fractions.top_right, "right": square * _positions.fractions.top_right, "bottom": square * _positions.fractions.bottom_left, "left": square * _positions.fractions.bottom_left};
	_positions.main = square*_positions.fractions.main;
	// _positions.canvas = {'x':_layout.svg_width-_positions.main-_positions._padding.right,'y':_positions._padding.top,'width':_positions.main,'height':_positions.main};
	_positions.canvas = {'x':_layout.svg_width/2-_positions.main/2-_positions.padding.right,'y':_positions.padding.top,'width':_positions.main,'height':_positions.main};
	
	var canvas = _svg.append("g").attr("class","dotplot_canvas").attr("transform","translate(" + _positions.canvas.x + "," + _positions.canvas.y + ")");
	canvas.append("rect").style("fill","#eeeeee").attr("width",_positions.canvas.width).attr("height",_positions.canvas.height);

	// Relative to canvas
	_positions.ref = {"left":0, "right":_positions.canvas.width, "y":_positions.canvas.height};
	_positions.read = {"top":0, "bottom":_positions.canvas.height, "x":_positions.canvas.width};

	// Draw read
	canvas.append("line").attr("x1",0).attr("x2", 0).attr("y1",_positions.read.top).attr("y2",_positions.read.bottom).style("stroke-width",1).style("stroke", "black");
	canvas.append("text").text("Read / Query").style('text-anchor',"middle")
		 .attr("transform", "translate("+ (-5*_padding.text) + "," + (_positions.canvas.height/2)+")rotate(-90)")


	// Draw ref
	canvas.append("line").attr("x1",_positions.ref.left).attr("x2", _positions.ref.right).attr("y1",_positions.ref.y).attr("y2",_positions.ref.y).style("stroke-width",1).style("stroke", "black");
	canvas.append("text").text("Reference").attr("x",(_positions.ref.left+_positions.ref.right)/2).attr("y",_positions.ref.y+_padding.text*2).style('text-anchor',"middle").attr("dominant-baseline","top");


	_scales.read_scale.range([_positions.read.bottom, _positions.read.top]);
	_scales.ref_interval_scale.range([_positions.ref.left, _positions.ref.right]);
	

	canvas.selectAll("rect.ref_interval").data(_Ref_intervals).enter()
		.append("rect").attr("class","ref_interval")
			.attr("x",function(d) { return _scales.ref_interval_scale(d.cum_pos); })
			.attr("y",0)
			.attr("width", function(d) {return (_scales.ref_interval_scale(d.end)-_scales.ref_interval_scale(d.start));})
			.attr("height", _positions.canvas.height)
			.attr("fill",function(d) {
				if (_settings.colorful) {return _scales.ref_color_scale(d.chrom);} else {return "white"}})
			.style("stroke-width",1).style("stroke", "black")
			.on('mouseover', function(d) {
				var text = d.chrom + ": " + comma_format(d.start) + " - " + comma_format(d.end);
				var x = _positions.canvas.x + _scales.ref_interval_scale(d.cum_pos + (d.end-d.start)/2);
				var y = _positions.canvas.y + _positions.canvas.height + _padding.text;
				show_tooltip(text,x,y,_svg);
			})
			.on('mouseout', function(d) {_svg.selectAll("g.tip").remove();})
			.style("stroke-opacity",0.1)
			.attr("fill-opacity",_static.dotplot_ref_opacity)

	// Alignments
	var a_groups = canvas.selectAll("g.alignment").data(_Alignments).enter()
		.append("g").attr("class","alignment");
	a_groups.append("path")
			.filter(function(d) {return d.mq >= _settings.min_mapping_quality && d.aligned_length >= _settings.min_align_length})
				.attr("d",dotplot_alignment_path_generator)
				.style("stroke-width",2)
				.style("stroke","black")
				.style("stroke-opacity",1)
				.style("fill","none")
				.on('mouseover', function(d) {
					var text = Math.abs(d.qe-d.qs) + " bp"; 
					var x = _positions.canvas.x + _scales.ref_interval_scale(map_ref_interval(d.r,(d.rs+d.re)/2));
					var y = _padding.text*(-3) + _positions.canvas.y + _scales.read_scale((d.qs+d.qe)/2);
					show_tooltip(text,x,y,_svg);
				})
				.on('mouseout', function(d) {_svg.selectAll("g.tip").remove();});

	var read_axis = d3.svg.axis().scale(_scales.read_scale).orient("left").ticks(5).tickSize(5,0,0).tickFormat(d3.format("s"))
	var read_axis_label = _svg.append("g")
		.attr("class","axis")
		.attr("transform","translate(" + _positions.canvas.x + "," + _positions.padding.top + ")")
		.call(read_axis)

}

function draw_ribbons() {
	reset_svg();

	if (_Alignments == undefined) {
		return;
	}


	// Calculate layouts within the svg
	_positions.read = {"y":_layout.svg_height*0.75, "x":_layout.svg_width*0.05, "width":_layout.svg_width*0.90, "height":_layout.svg_height*0.03};
	_positions.ref_block = {"y":_layout.svg_height*0.15, "x":_positions.read.x, "width":_positions.read.width, "height":_positions.read.height};
	_positions.ref_intervals = {"y":_layout.svg_height*0.35, "x":_positions.read.x, "width":_positions.read.width, "height":_positions.read.height};

	// Draw read
	_svg.append("rect").attr("class","read").attr("x",_positions.read.x).attr("y",_positions.read.y).attr("width",_positions.read.width).attr("height",_positions.read.height).style("stroke-width",1).style("stroke", "black").attr("fill","black")
		.on('mouseover', function() {
			var text = "read: " + _Alignments[_Alignments.length-1].read_length + " bp";
			var x = _positions.read.x+_positions.read.width/2;
			var y = _positions.read.y+_positions.read.height*3.5;
			show_tooltip(text,x,y,_svg);
		})
	_svg.append("text").text("Read / Query").attr("x",_positions.read.x+_positions.read.width/2).attr("y",_positions.read.y+_positions.read.height*3.5).style('text-anchor',"middle").attr("dominant-baseline","top");
	
	// Draw "Reference" label
	_svg.append("text").attr("id","ref_tag").text("Reference").attr("x",_positions.ref_block.x+_positions.ref_block.width/2).attr("y",_positions.ref_block.y-_positions.ref_block.height*3).style('text-anchor',"middle").attr("dominant-baseline","middle");

	var font_size = parseFloat(d3.select("#ref_tag").style("font-size"));

	_scales.read_scale.range([_positions.read.x,_positions.read.x+_positions.read.width]);
	_scales.whole_ref_scale.range([_positions.ref_block.x, _positions.ref_block.x + _positions.ref_block.width]);
	_scales.ref_interval_scale.range([_positions.ref_intervals.x, _positions.ref_intervals.x+_positions.ref_intervals.width]);
	
	// Whole reference chromosomes for the relevant references:
	_svg.selectAll("rect.ref_block").data(_Whole_refs).enter()
		.append("rect").attr("class","ref_block")
			.attr("x",function(d) { return _scales.whole_ref_scale(d.cum_pos); })
			.attr("y",_positions.ref_block.y)
			.attr("width", function(d) {return (_scales.whole_ref_scale(d.cum_pos + d.size) - _scales.whole_ref_scale(d.cum_pos));})
			.attr("height", _positions.ref_block.height)
			.attr("fill",function(d) {return _scales.ref_color_scale(d.chrom);})
			.style("stroke-width",1).style("stroke", "black")
			.on('mouseover', function(d) {
				var text = d.chrom + ": " + bp_format(d.size);
				var x = _scales.whole_ref_scale(d.cum_pos + d.size/2);
				var y = _positions.ref_block.y - _padding.text;
				show_tooltip(text,x,y,_svg);
			})
			.on('mouseout', function(d) {_svg.selectAll("g.tip").remove();});

	_svg.selectAll("text.ref_block").data(_Whole_refs).enter()
		.append("text").attr("class","ref_block")
			.filter(function(d) {return (_scales.whole_ref_scale(d.cum_pos + d.size) - _scales.whole_ref_scale(d.cum_pos) > ((font_size/5.)*d.chrom.length));})
				.text(function(d){var chrom = d.chrom; return chrom.replace("chr","")})
				.attr("x", function(d) { return _scales.whole_ref_scale(d.cum_pos + d.size/2)})
				.attr("y",_positions.ref_block.y - _padding.text)
				.style('text-anchor',"middle").attr("dominant-baseline","bottom");
				// .attr("height", _positions.ref_block.height)
				// .attr("width", function(d) {return (_scales.whole_ref_scale(d.cum_pos + d.size)-_scales.whole_ref_scale(d.cum_pos));})
				// .attr("font-size",function(d) {return (_scales.whole_ref_scale(d.cum_pos + d.size)-_scales.whole_ref_scale(d.cum_pos))/2;});
	
	// Zoom into reference intervals where the read maps:
	_svg.selectAll("rect.ref_interval").data(_Ref_intervals).enter()
		.append("rect").attr("class","ref_interval")
			.attr("x",function(d) { return _scales.ref_interval_scale(d.cum_pos); })
			.attr("y",_positions.ref_intervals.y)
			.attr("width", function(d) {return (_scales.ref_interval_scale(d.end)-_scales.ref_interval_scale(d.start));})
			.attr("height", _positions.ref_intervals.height)
			.attr("fill",function(d) {return _scales.ref_color_scale(d.chrom);})
			.style("stroke-width",1).style("stroke", "black")
			.on('mouseover', function(d) {
				var text = d.chrom + ": " + comma_format(d.start) + " - " + comma_format(d.end);
				var x = _scales.ref_interval_scale(d.cum_pos + (d.end-d.start)/2);
				var y = _positions.ref_intervals.y - _padding.text;
				show_tooltip(text,x,y,_svg);
			})
			.on('mouseout', function(d) {_svg.selectAll("g.tip").remove();});

	_svg.selectAll("path.ref_mapping").data(_Ref_intervals).enter()
		.append("path").attr("class","ref_mapping")
			.filter(function(d) {return map_whole_ref(d.chrom,d.start) != undefined;})
				.attr("d",function(d) {return ref_mapping_path_generator(d,false)})
				// .style("stroke-width",2)
				// .style("stroke","black")
				.attr("fill",function(d) {return _scales.ref_color_scale(d.chrom);})


	// Alignments
	_svg.selectAll("path.alignment").data(_Alignments).enter()
		.append("path")
			.filter(function(d) {return d.mq >= _settings.min_mapping_quality && d.aligned_length >= _settings.min_align_length})
			.attr("class","alignment")
			.attr("d",ribbon_alignment_path_generator)
			.style("stroke-width",function() { if (_settings.ribbon_outline) {return 1;} else {return 0;} })
			.style("stroke","black")
			.style("stroke-opacity",1)
			.attr("fill",function(d) {return _scales.ref_color_scale(d.r);})
			.attr("fill-opacity",_static.alignment_alpha)
			.on('mouseover', function(d) {
				var text = Math.abs(d.qe-d.qs) + " bp"; 
				var x = _scales.read_scale((d.qs+d.qe)/2);
				var y = _positions.read.y - _padding.text;
				show_tooltip(text,x,y,_svg);
			})
			.on('mouseout', function(d) {_svg.selectAll("g.tip").remove();});


	var read_axis = d3.svg.axis().scale(_scales.read_scale).orient("bottom").ticks(5).tickSize(5,0,0).tickFormat(d3.format("s"))
	var read_axis_label = _svg.append("g")
		.attr("class","axis")
		.attr("transform","translate(" + 0 + "," + (_positions.read.y+_positions.read.height) + ")")
		.call(read_axis)

}


// ===========================================================================
// == Examples
// ===========================================================================

function show_info_panel() {
	if (d3.select("#info_panel").style("display") == "none") {
		d3.select("#info_panel").style("display","block");	
	} else {
		d3.select("#info_panel").style("display","none");
	}
}

d3.select("#click_info_link").on("click",show_info_panel)

function add_examples_to_navbar() {
	d3.select("#examples_navbar_item").style("visibility","visible");
	navbar_examples = d3.select("ul#examples_list");

	jQuery.ajax({
			url: "examples",
			error: function() {
				navbar_examples.append("li").html("Can't find examples. Create a directory called examples within the main ribbon directory and put .sam and .coords files inside it, then they will show up here");
			},
			success: function (data) {
				$(data).find("a:contains(.sam)").each(function() {
					// will loop through
					var example_file = $(this).attr("href");

					navbar_examples.append("li").append("a")
						.attr("href",void(0))
						.on("click",function() {read_example_sam(example_file);})
						.text(example_file);
				})
				$(data).find("a:contains(.coords)").each(function() {
					// will loop through
					var example_file = $(this).attr("href");

					navbar_examples.append("li").append("a")
						.attr("href",void(0))
						.on("click",function() {read_example_coords(example_file);})
						.text(example_file);
				})
			}
	});
}



function read_example_sam(filename) {
	user_message("Info","Loading sam file. This may take a few minutes.");
	jQuery.ajax({url: "examples/" + filename, success: function(file_content) {
		sam_input_changed(file_content);
		clear_sam_input();
		d3.select("#collapsible_alignment_input_box").attr("class","panel-collapse collapse");
	 	// // Open the sam tab
	 	// $('.nav-tabs a[href="#sam"]').tab('show');
	}})
}


function read_example_coords(filename) {
	user_message("Info","Loading coordinates file. This may take a few minutes.");
	jQuery.ajax({url: "examples/" + filename, success: function(file_content) {
		coords_input_changed(file_content);
		d3.select("#collapsible_alignment_input_box").attr("class","panel-collapse collapse");
		clear_coords_input();
	 	// // Open the coords tab
	 	// $('.nav-tabs a[href="#coords"]').tab('show');
	}})
}

add_examples_to_navbar();

// ===========================================================================
// == Load bed file
// ===========================================================================

function open_variant_file(event) {
	if (this.files[0].size > 1000000) {
		user_message("Warning","Loading large file may take a while.");
	}
	
	var file_extension = /[^.]+$/.exec(this.files[0].name)[0];
	if (file_extension == "vcf") {
		var raw_data;
		var reader = new FileReader();
		reader.readAsText(this.files[0]);
		reader.onload = function(event) {
			raw_data = event.target.result;
			clear_vcf_input();
			vcf_input_changed(raw_data);
			d3.select("#collapsible_variant_upload_box").attr("class","panel-collapse collapse");
		}
		
	}
	else if (file_extension == "bed") {
		var raw_data;
		var reader = new FileReader();
		reader.readAsText(this.files[0]);
		reader.onload = function(event) {
			raw_data = event.target.result;
			clear_bed_input();
			bed_input_changed(raw_data);
			d3.select("#collapsible_variant_upload_box").attr("class","panel-collapse collapse");
		}

	} else {
		user_message("Error", "File extension must be .bed or .vcf");
	}
}

d3.select("#variant_file").on("change",open_variant_file);


// ===========================================================================
// == Load coords file
// ===========================================================================


function open_coords_file(event) {
	console.log("in open_coords_file");
		
	var raw_data;
	var reader = new FileReader();

	if (this.files[0].size > 1000000) {
		user_message("Warning","Loading large file may take a while.");
	}

	reader.readAsText(this.files[0]);
	reader.onload = function(event) {
		raw_data = event.target.result;
		clear_coords_input();
		coords_input_changed(raw_data);
		d3.select("#collapsible_alignment_input_box").attr("class","panel-collapse collapse");
	}
}

d3.select("#coords_file").on("change",open_coords_file);

// ===========================================================================
// == Load bam file
// ===========================================================================

function open_bam_file(event) {

	create_bam(event.target.files);
}

document.getElementById('bam_file').addEventListener('change',open_bam_file,false);

function create_bam(files) {
	// From bam.iobio, thanks Marth lab!
	if (files.length != 2) {
		 alert('must select both a .bam and .bai file');
		 return;
	}

	var fileType0 = /[^.]+$/.exec(files[0].name)[0];
	var fileType1 = /[^.]+$/.exec(files[1].name)[0];

	if (fileType0 == 'bam' && fileType1 == 'bai') {
		bamFile = files[0];
		baiFile = files[1];
	 } else if (fileType1 == 'bam' && fileType0 == 'bai') {
			bamFile = files[1];
			baiFile = files[0];
	 } else {
			alert('must select both a .bam and .bai file');
	 }
	_Bam = new Bam( bamFile, { bai: baiFile });

	wait_then_run_when_all_data_loaded();
}


function wait_then_run_when_all_data_loaded(counter) {
	if (counter == undefined) {
		counter = 0;
	} else if (counter > 30) {
		user_message("Error","File taking too long to load")
		return;
	}
	if (_Bam.header != undefined) {
		console.log("ready")
		bam_loaded();
	} else {
		console.log("waiting for data to load")
		window.setTimeout(function () {wait_then_run_when_all_data_loaded(counter+1)},300)
	}


}

function clear_sam_input() {
	d3.select('#sam_input').property("value","");
}

function clear_coords_input() {
	d3.select('#coords_input').property("value","");
}
function clear_bed_input() {
	d3.select('#bed_input').property("value","");
}
function clear_vcf_input() {
	d3.select('#vcf_input').property("value","");
}



function bam_loaded() {
	_settings.current_input_type = "bam";

	clear_sam_input();
	clear_coords_input();

	clear_data();

	record_bam_header();

	organize_references_for_chunk();
	show_all_chromosomes();
	apply_ref_filters();

	reset_svg2();
	draw_chunk_ref();
	d3.select("#collapsible_alignment_input_box").attr("class","panel-collapse collapse");

	d3.select("#region_selector_panel").style("display","block");
	d3.select("#variant_input_panel").style("display","block");

	user_message("Info", "Loaded alignments from " + _Whole_refs.length + " reference sequences (chromosomes). Select a region to fetch reads or upload variants to inspect. ");

	

	refresh_visibility();
}

function record_bam_header() {
	
	// console.log(bam); 
	// console.log( bam.bam.indices[bam.bam.chrToIndex["chr2"]] );

	// console.log(bam.header.sq);
	_Ref_sizes_from_header = {};
	for (var i in _Bam.header.sq) {
		_Ref_sizes_from_header[_Bam.header.sq[i].name] = _Bam.header.sq[i].end;
	}
	
	var chromosomes = [];
	for (var chrom in _Ref_sizes_from_header) {
		if (chromosomes.indexOf(chrom) == -1) {
			chromosomes.push(chrom);
		}
	}
	chromosomes.sort(natural_sort);

	_Whole_refs = [];
	var cumulative_whole_ref_size = 0;
	for (var j = 0; j < chromosomes.length; j++){
		var chrom = chromosomes[j];
		if (isNaN(_Ref_sizes_from_header[chrom])) {
			console.log("Skipping chromosome: " + chrom + " because its size is not a number");
		} else {
			_Whole_refs.push({"chrom":chrom, "size":_Ref_sizes_from_header[chrom], "cum_pos":cumulative_whole_ref_size});
			cumulative_whole_ref_size += _Ref_sizes_from_header[chrom];	
		}
	}

	_scales.whole_ref_scale.domain([0,cumulative_whole_ref_size]);
	_scales.ref_color_scale.domain(chromosomes);

}

function remove_bam_file() {
	// For when sam input changes, clear bam file to prevent confusion and enable switching back to the bam file
	d3.select('#bam_file').property("value","");
	d3.select("#region_selector_panel").style("display","none");
}
function remove_coords_file() {
	// For when sam input or coords text input changes, clear bam file to prevent confusion and enable switching back to the bam file
	d3.select('#coords_file').property("value","");
}




// ===========================================================================
// == Select region
// ===========================================================================


function get_chrom_index(chrom) {
	for (var i = 0; i < _Whole_refs.length; i++) {
		if (_Whole_refs[i].chrom == chrom || _Whole_refs[i].chrom == "chr" + chrom) {
			return i;
		}
	} 
	return undefined;
}


var _loading_bam_right_now = false;
function show_waiting_for_bam() {
	user_message("Info","Fetching bam records at position");
	d3.select("#region_go").property("disabled",true);
	d3.select("#region_go").html("Fetching...");
	d3.select("#region_go").style("color","gray");
	d3.selectAll(".fetch_table_button").html("...");
	_loading_bam_right_now = true;
}

function show_bam_is_ready() {
	d3.select("#region_go").property("disabled",false);
	d3.select("#region_go").html("Go");
	d3.select("#region_go").style("color","black");
	d3.selectAll(".fetch_table_button").html("go to variant");
	_loading_bam_right_now = false;
}

function go_to_region(chrom,start,end) {
	_focal_region = {"chrom":chrom,"start":start,"end":end};

	if (_Bam != undefined) {
		console.log("Fetching bam records at position");
		show_waiting_for_bam();

		_Bam.fetch(chrom,start,end,use_fetched_data);
	} else {
		console.log("No bam file");
		user_message("Error","No bam file");
	}
}

//////////////////////////////    Fetch bam data from a specific region  //////////////////////////////

function parse_bam_record(record) {
	
	var chrom = record.segment;
	var rstart = record.pos;
	var flag = record.flag;
	var mq = record.mq;
	var raw_cigar = record.cigar;
	
	var strand = "+";
	if ((flag & 16) == 16) {
		strand = "-";
	}

	if (mq == undefined) {
		console.log("record missing mq");
		console.log(record);
	}
	
	var alignments = [];
	
	if (record.SA != undefined) {
		alignments = parse_SA_field(record.SA);	
	}
	
	alignments.push(read_cigar(raw_cigar,chrom,rstart,strand,mq));

	var read_length = alignments[alignments.length-1].read_length;

	for (var i = 0; i < alignments.length; i++) {
		 if (alignments[i].read_length != read_length) {
				user_message("Warning", "read length of primary and supplementary alignments do not match for this read (calculated using cigar strings)");
		 }
	}


	return {"alignments": alignments, "raw":record, "raw_type":"bam", "readname":record.readName};

}


function use_fetched_data(records) {
	console.log("Bam record finished loading");
	show_bam_is_ready();
	var consolidated_records = [];
	if (_settings.keep_duplicate_reads == false) {
		var used_readnames = {};
		for (var i in records) {
			if (used_readnames[records[i].readName] == undefined) {
				consolidated_records.push(records[i]);
				used_readnames[records[i].readName] = true;
			}
		}
	} else {
		consolidated_records = records;
	}

	_settings.min_indel_size = 100000000000; 
	_Chunk_alignments = [];
	for (var i in consolidated_records) {
		_Chunk_alignments.push(parse_bam_record(consolidated_records[i]));
	}
	chunk_changed();
	user_message("Info","Total reads mapped in region: " + _Chunk_alignments.length);
}


function region_submitted(event) {

	var chrom = d3.select("#region_chrom").property("value");
	if (chrom == "") {
		user_message("Error","No chromosome given");
		return;
	}
	var start = parseInt(d3.select("#region_start").property("value").replace(/,/g,""));
	var end = start + 1; //parseInt(d3.select("#region_end").property("value").replace(/,/g,""));

	if (isNaN(start) == true) {
		user_message("Error", "start value:" + d3.select("#region_start").property("value") + " could not be made into a number");
	} //else if (isNaN(end) == true) {
	// 	user_message("Error", "end value:" + d3.select("#region_end").property("value") + " could not be made into a number");
	// }

	var chrom_index = get_chrom_index(chrom);
	if (chrom_index != undefined) {
		chrom = _Whole_refs[chrom_index].chrom;
		if (start > _Whole_refs[chrom_index].size) {
			start = _Whole_refs[chrom_index].size;
		}
		if (end > _Whole_refs[chrom_index].size) {
			end = _Whole_refs[chrom_index].size;
		}
		if (start < 0) {
			start = 0;
		}
		if (end < 0) {
			end = 0;
		}
		if (start > end) {
			var tmp = start;
			start = end;
			end = tmp;
		}

		// Correct any issues with coordinates
		d3.select("#region_chrom").property("value",chrom);
		d3.select("#region_start").property("value",start);
		// d3.select("#region_end").property("value",end);

		go_to_region(chrom,start,end);

	} else {
		// console.log("Bad");
		user_message("Error","Chromosome does not exist in reference");
	}
}



d3.select("#region_go").on("click",region_submitted);
d3.select("#region_chrom").on("keyup",function(){ if (d3.event.keyCode == 13 && !_loading_bam_right_now) {region_submitted()} });
d3.select("#region_start").on("keyup",function(){ if (d3.event.keyCode == 13 && !_loading_bam_right_now) {region_submitted()} });
// d3.select("#region_end").on("keyup",function(){ if (d3.event.keyCode == 13) {region_submitted()} });



if (splitthreader_data != "") {
	console.log("Found SplitThreader data");
	console.log(splitthreader_data);

	console.log("GOOD");
	_Variants = [];
	for (var i in splitthreader_data) {
		_Variants.push({"chrom":splitthreader_data[i].chrom1, "start":splitthreader_data[i].start1, "end":splitthreader_data[i].stop1, "name": splitthreader_data[i].variant_name + ".1", "score": splitthreader_data[i].score, "strand": splitthreader_data[i].strand1,"type":splitthreader_data[i].variant_type});
		_Variants.push({"chrom":splitthreader_data[i].chrom2, "start":splitthreader_data[i].start2, "end":splitthreader_data[i].stop2, "name": splitthreader_data[i].variant_name + ".2", "score": splitthreader_data[i].score, "strand": splitthreader_data[i].strand2,"type":splitthreader_data[i].variant_type});
	}
	// _Variants.push({"chrom":columns[0],"start":start, "end":end, "size": end - start, "name":columns[3] || "", "score":score ,"strand":columns[5],"type":columns[6] || ""});

	update_variants();
	
}



if (igv_data != "") {
	d3.select("#igv_stats").html("found something in POST. Check console.");
	console.log("igv_data:", igv_data);
 
 	// Open the "from igv" tab
 	$('.nav-tabs a[href="#igv"]').tab('show');

	// if input is text of sam file send to sam_input_changed(sam_text)
	// otherwise make new parser on the fields, similar to what we did for the bam records, and need to treat the header separately too
}


// ===========================================================================
// == Responsiveness
// ===========================================================================


// Resize SVG and sidebar when window size changes
window.onresize = resizeWindow;


function resizeWindow() {
	responsive_sizing();
}

run();

