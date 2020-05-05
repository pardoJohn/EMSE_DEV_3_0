--		"ReportViewer.aspx?rn=Subreport&master=MainReport&ddkvalue=[OrderID]&ddkvalue2=[ShipCountry]"

--define CSS classes by STATUS
case when [STATUS] = 'Green' THEN 'success'
 when [STATUS] = 'Yellow' THEN 'warning'
 when [STATUS] = 'Red' THEN 'danger'
 when [STATUS] = 'Scheduled' then 'Primary'
ELSE 'Default'
END


exclamation-sign

--define CSS GLYPHICON by STATUS
case when [STATUS] = 'Green' THEN 'thumbs-up'
 when [STATUS] = 'Yellow' THEN 'flag'
 when [STATUS] = 'Red' THEN 'exclamation-sign'
 when [STATUS] = 'Scheduled' then 'time'
ELSE 'time'
END

-- order by

case [STATUS]
 when 'Scheduled' then 4
 when 'Green' then 1
 when 'Yellow' then 2
 when 'Red' then 3
else 5
end


-----EXAMPLES BELOW----------

--define CSS classes by solution type
case when [Solution Type] = 'Standard' THEN 'label label-success'
 when [Solution Type] = 'Certified' THEN 'label label-primary'
 when [Solution Type] = 'Custom' THEN 'label label-warning' 
ELSE 'label label-danger'
END

--define CSS classes for solution risk labels
case when [Risk] = 'Low' THEN 'label label-success'
 when [Risk] = 'Medium' THEN 'label label-warning'
 when [Risk] = 'High' THEN 'label label-danger' 
ELSE 'hide'
END

--define CSS classes for adoptoin labels
case when [Overall User Experience] = 'Good' THEN 'label label-success'
 when [Overall User Experience] = 'Ok' THEN 'label label-warning'
 when [Overall User Experience] = 'Poor' THEN 'label label-danger' 
ELSE 'label label-danger'
END


--define CSS classes by solution risk table rows
case when [Risk] = 'Low' THEN 'success'
 when [Risk] = 'Medium' THEN 'warning'
 when [Risk] = 'High' THEN 'danger' 
ELSE null
END

--define CSS classes by solution type
case when [STATUS] = 'Removed' THEN 'label label-danger'
 when [STATUS] = 'Rejected' THEN 'label label-danger'
  when [STATUS] = 'Configuration' THEN 'label label-warning' 
  when [STATUS] = 'Development' THEN 'label label-warning' 
  when [STATUS] = 'Backlog' THEN 'label label-warning' 
  when [STATUS] = 'Architecture' THEN 'label label-warning' 
  when [STATUS] = 'Review' THEN 'label label-warning' 
 when [STATUS] = 'Accepted' THEN 'label label-success' 
ELSE 'label label-primary'
END

--define CSS classes by solution type
case when [PARENT_STATUS] = 'Removed' THEN 'danger'
 when [PARENT_STATUS] = 'Rejected' THEN 'danger'
  when [PARENT_STATUS] = 'Configuration' THEN 'warning' 
  when [PARENT_STATUS] = 'Development' THEN 'warning' 
  when [PARENT_STATUS] = 'Backlog' THEN 'warning' 
  when [PARENT_STATUS] = 'Architecture' THEN 'warning' 
  when [PARENT_STATUS] = 'Review' THEN 'warning' 
 when [PARENT_STATUS] = 'Accepted' THEN 'success' 
ELSE 'primary'
END

--define CSS for strikethrough by status
case when [Status] = 'Not Needed' then 'strike'
else null
end

--remove 'Project' from record type for deliverableType
case [RECORD_TYPE]
	when 'Project Solution' then 'Solution'
	when 'Project Integration' then 'Integration'
	when 'Project Data Conversion' then 'Data Conversion'
	else [RECORD_TYPE]
end


--define CSS classes by solution complexity
case when [Complexity] = 'Small' THEN 'label label-success'
 when [Complexity] = 'X-Small' THEN 'label label-success'
 when [Complexity] = 'Medium' THEN 'label label-info'
 when [Complexity] = 'Large' THEN 'label label-danger'
ELSE 'label label-danger'
END

--define CSS classes by solution complexity table rows
case when [Complexity] = 'Small' THEN 'success'
 when [Complexity] = 'X-Small' THEN 'success'
 when [Complexity] = 'Medium' THEN 'info'
 when [Complexity] = 'Large' THEN 'danger'
ELSE 'danger'
END

--default solution risk to blank if low
case when [Risk] = 'Low' THEN ''
ELSE [Risk] || ' Risk'
END

--default solution type to 'New Solution Required' if null
case when [Solution Type] is null THEN 'Custom'
ELSE [Solution Type]
END


case when [Packaged Solution] is null THEN 'New Solution Required'
ELSE [Domain] || ' > ' || [Packaged Solution] || ' > ' || [Process]
END

-- hide with CSS case statement
case when [Risk Description] is null then 'hide'
else ''
end



---
var gScript = document.createElement( "script" );
gScript.src = "https://www.gstatic.com/charts/loader.js";
gScript.type = "text/javascript";
document.getElementsByTagName( "head" )[0].appendChild( gScript );

google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(drawChart);
function drawChart() {

var data = google.visualization.arrayToDataTable([
  ['Task', 'Hours per Day'],
  ['Work',     11],
  ['Eat',      2],
  ['Commute',  2],
  ['Watch TV', 2],
  ['Sleep',    7]
]);

var options = {
  title: 'My Daily Activities'
};

var chart = new google.visualization.PieChart(document.getElementById('piechart'));

chart.draw(data, options);
}

<div id="piechart" style="width: 900px; height: 500px;"></div>


<div class="subreport">
	[[Solutions Subreports\Project Solutions Charts]]
</div>