
import React from 'react';
import ReactDOM from 'react-dom';
import { LineChart } from 'chartkick';
import { Paper, Typography, Icon } from 'material-ui';
import Tabs, { Tab } from 'material-ui/Tabs';
import Card, { CardActions, CardContent } from 'material-ui/Card';

const TEMP_ID = 'TEMP_ID';
const ID_SUFFIX = 'ID';
const VALUES_SUFFIX = "Values";
const SECONDS_SUFFIX = "Seconds";
const INIT_SUFFIX = "init";
const CHART_SUFFIX = "chart";
const everyXSecond = 5000;
String.prototype.replaceAll = function(search, replacement) {
  var target = this;
  return target.split(search).join(replacement);
};

const chartIndexes = [
{
	index: "temp",
	suffix: "C",
	header: "GPU Temparature",
	minMax: 25,
	maxMax: 110,
	factor: 60,
	icon: <Icon>whatshot</Icon>,
},{
	index: "coreClock",
	suffix: "Mhz",
	header: "Core Clock",
	minMax: 500,
	maxMax: 3200,
	factor: 500,
	icon: <Icon>graphic_eq</Icon>,
},{
	index: "memoryClock",
	suffix: "Mhz",
	header: "Memory Clock",
	minMax: 500,
	maxMax: 12000,
	factor: 2000,
	icon: <Icon>group_work</Icon>,
},{
	index: "memoryUsed",
	suffix: "MiB",
	header: "Memory Used",
	minMax: 0,
	maxMax: 128000,	
	factor: 2000,
	icon: <Icon>memory</Icon>,
},{
	index: "power",
	suffix: "Watts",
	header: "Power Draw",
	minMax: 0,
	maxMax: 1500,	
	factor: 200,
	icon: <Icon>power</Icon>,
}
];
const colorList = ['#2ecc71', '#e74c3c', '#3498db', '#f1c40f', '#9b59b6', '#34495e',
					 '#1abc9c', '#e67e22', '#46f0f0', '#f032e6', '#fabebe', '#008080',
					 '#e6beff', '#aa6e28', '#d2f53c', '#800000', '#aaffc3', '#808000',
					 '#000080', '#808080'];
const exec = require('child_process').exec;
const gpu_query_columns = [
	'index',
	'uuid',
	'name',
	'temperature.gpu', //*c
	'utilization.gpu', //percent 
	'memory.used', //mib
	'memory.total',
	'power.draw',
	'clocks.current.graphics', //mhz
	'clocks.current.memory',//mhz
	'count',
/*
    'index',
    'count',
    'name',
    'pcie.link.width.current',
    'pcie.link.gen.current',
    'display_mode',
    'display_active',
    'driver_version',
    'uuid',
    'fan.speed',
    'pstate',
    'memory.total',
    'memory.used',
    'memory.free',
    'utilization.gpu',
    'temperature.gpu',
    'power.draw',
    'clocks.gr',
    'clocks.sm',
    'clocks.mem',
    'clocks.video',
    'clocks.current.graphics',
    'clocks.current.memory'
    */
   ].join(",");
   const cmd = `nvidia-smi --query-gpu=${gpu_query_columns} --format=csv,noheader,nounits`;

const printLabel = (label, val) => (
		<div>
			<label>{label}:</label>
			{val}
		</div>
);
const getRandom = (arr, n) => {
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len;
    }
    return result;
}
//['index', 'uuid', 'name', 'temperature.gpu','utilization.gpu', 'memory.used', 'memory.total','power.draw','clocks.current.graphics','clocks.current.memory'];
export default class Main extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			count: 0,
			value: 0,
			gpus: [],
		}
	}
	  handleChange = (event, value) => {
	    this.setState({ value });
	  };

	componentDidMount(){
	    exec('nvidia-smi', (err, stdout) => {
	    	if(err){
	    	   throw new Error('nVidia SMI is not available, verify that it is part of your PATH environment variable');
	    	}else{
        		setInterval(this.queryGpus, everyXSecond);
        		this.queryGpus();
	    	}
	    });
	}
	initializeCharts = ({index_name, seconds, min, max}) => {
		if(this[index_name+INIT_SUFFIX]) return false;

		this[index_name+VALUES_SUFFIX] = [];
		this[index_name+SECONDS_SUFFIX] = Array.from(new Array(seconds),(val,index)=>index+1);

		for (var i = 0; i < this.state.count; i++){
			this[index_name+VALUES_SUFFIX].push((new Array(seconds)).fill(0))
		}
	    this[index_name+CHART_SUFFIX] = new LineChart(index_name + ID_SUFFIX, [],
			{
				colors: getRandom(colorList, this.state.count),
				legend: true,
				min: min,
				max: max,
				points: false,
			});
	    this[index_name+INIT_SUFFIX] = true;
	}
	queryGpus = () => {
	    exec(cmd,(err, stdout) => {
	        if(err){
	 			throw new Error(err);
	        } else {
	        	//stdout = stdout + "\n" + stdout + "\n" + stdout; // test case remove in prod , add count below

	        	let chunk = stdout.split("\n");
				let vals = [];
				chunk.map(ox=>{
					ox = ox.trim();
					if(ox.length > 0){
						let o = ox.split(",");
						let power = parseInt(o[7]);
						if(isNaN(power)) power = -1;
						const tmp_val = {
								count: parseInt(o[10]),
								name: o[2],
								temp: parseInt(o[3]),
								memoryUsed: parseInt(o[5]),
								memoryTotal: parseInt(o[6]),
								power: power,
								coreClock: parseInt(o[8]),
								memoryClock: parseInt(o[9]),
				        };
						vals.push(tmp_val);		
				        chartIndexes.map(o=>{
				        	if(!o.min || tmp_val[o.index] < o.min){
				        		o.min = tmp_val[o.index] - o.factor;
				        		if(o.min < o.minMax) o.min = o.minMax;
				        	}
				        	if(!o.max || tmp_val[o.index] > o.max){
				        		o.max = tmp_val[o.index] + o.factor;
				        		if(o.max > o.maxMax) o.max = o.maxMax;
				        		if (o.index == 'memoryUsed') o.max = tmp_val["memoryTotal"];
				        	}
				        })
			        }
				});
		    this.transformData(vals);
		  }
	    });
	}
	transformData = (vals) => {
		const gpus = vals.map(o=>({
			name: o.name,
			memoryTotal: o.memoryTotal,
			memoryClock: o.memoryClock,
			coreClock: o.coreClock,
			power: o.power,
		}));

		if(!this.inited){		
			this.setState({
				count: vals[0].count, //all count are same so 
				gpus: gpus
			})
		}

			chartIndexes.map( (o,i)=>{
				if(o.index != "power" || gpus[0].power > -1){
					if(!this.inited){
						this.initializeCharts({
							index_name: o.index,
							seconds: o.seconds || 30,
							min: o.min || 0,
							max: o.max || 100,
						});
					}
					this.setValues(vals, o.index, o.suffix);
				}	
			})
			this.inited = true;
	}

	//index_name = temp, suffix = C
	setValues = (val, index_name, suffix) => {
		const valuesIndexName = index_name + VALUES_SUFFIX;
		const secondsIndexName = index_name + SECONDS_SUFFIX;
		if(!this[valuesIndexName]) return false;
		this[valuesIndexName].forEach((gpu, i) => this[valuesIndexName][i].splice(0, 1))
		this[valuesIndexName].forEach((gpu, i) => this[valuesIndexName][i].push(val[i][index_name].toFixed(1)))

		let gpuData = []
		this[valuesIndexName].forEach((gpu, i) => {
			let name = val[i].name + ' ' + val[i][index_name].toFixed(1) + suffix;
			gpuData.push({
				name: name,
				data: this[valuesIndexName][i].map((d, i) => [this[secondsIndexName][i], d])
			})		
		})
		this[index_name + CHART_SUFFIX].updateData(gpuData);

	}
	render(){
		const { value } = this.state;

		return(
			<div>
				<div className="h1">{this.state.name}</div>
		          <Tabs
		            value={value}
		            onChange={this.handleChange}
		            scrollable
		            scrollButtons="on"
		            indicatorColor="primary"
		            textColor="primary"
		            style={{margin: '10px 0'}}
		          >
			        <Tab label="Details" icon={<Icon>info</Icon>} key={-1} />
					{chartIndexes.map( (o,i)=>{
						if(o.index != "power" || (this.state.gpus[0] && this.state.gpus[0].power > -1)){
							return(
				            	<Tab label={o.header} icon={o.icon} key={i} />
							)
						}else{
				           return (<Tab className="invisible" label={o.header} icon={o.icon} key={i} />);
						}
					})}
		          </Tabs>
				<Paper className={(value == 0) ? '':'invisible'}>
				 	{this.state.gpus.map((o,i)=>{
				 		return (
  							<Card key={i}>
        						<CardContent>
							      <Typography type="headline" component="h2">
							      	{o.name}
							      </Typography>        						
							      <div className="clearfont">
							      	{printLabel("Memory",o.memoryTotal+"MB")}
							      </div>        						
							      <div className="clearfont">
							      	{printLabel("Core Clock Speed",o.coreClock+"Mhz")}
							      	{printLabel("Memory Clock Speed",o.memoryClock+"Mhz")}
							      	{(o.power > -1) ? printLabel("Power",o.power+"W") : ""}
							      </div>        						
        						</CardContent>				 			
        					</Card>				 			
				 			);				 		
				 	})}
				</Paper>
				{chartIndexes.map( (o,i)=>{
					return(
						<MakeChart className={(value == i+1) ? '':'invisible'} index_name={o.index} key={i} />
					)
				})}
			</div>
		);
	}
}
//{"2013-02-10 00:00:00 -0800": 11, "2013-02-11 00:00:00 -0800": 6}
const MakeChart = (props) => (
	<Paper className={props.className}>
		<div id={props.index_name + ID_SUFFIX} style={{height: '400px'}}></div>
	</Paper>
);
//0, GPU-8dd637a2-1795-5579-b092-2eda825636d2, GeForce 930M, 53, 57 %, 327 MiB, 2002 MiB, [Not Supported], 941 MHz, 900 MHz