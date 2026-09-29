const $ = (selector) => document.querySelector(selector);
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const demoStudents = [
  { id:'001', name:'Estudiante 1', group:'4° A' },
  { id:'002', name:'Estudiante 2', group:'4° A' },
  { id:'003', name:'Estudiante 3', group:'4° A' },
  { id:'004', name:'Estudiante 4', group:'4° B' },
  { id:'005', name:'Estudiante 5', group:'4° B' }
];
let data={students:demoStudents.map(student=>({...student})),records:[]};
function formatDate(date){if(!date)return '—';const [y,m,d]=date.split('-');return `${d}/${m}/${y}`;}
function el(tag,value){const node=document.createElement(tag);node.textContent=value;return node;}
function emptyRow(body,columns,message){const row=body.insertRow();const cell=row.insertCell();cell.colSpan=columns;cell.className='empty';cell.textContent=message;}
function navigate(page){
  document.querySelectorAll('.page').forEach(node=>node.classList.toggle('hidden',node.id!==page));
  document.querySelectorAll('.nav').forEach(node=>node.classList.toggle('active',node.dataset.page===page));
  render();
}
document.querySelectorAll('[data-page]').forEach(btn=>btn.addEventListener('click',()=>navigate(btn.dataset.page)));
document.querySelectorAll('[data-go]').forEach(btn=>btn.addEventListener('click',()=>{navigate(btn.dataset.go);if(btn.dataset.add)openStudentDialog();}));
$('#login-form').addEventListener('submit',event=>{event.preventDefault();$('#signed-user').textContent=$('#username').value.trim();$('#login').classList.add('hidden');$('#app').classList.remove('hidden');navigate('dashboard');});
$('#logout').addEventListener('click',()=>{$('#app').classList.add('hidden');$('#login').classList.remove('hidden');$('#password').value='';});

function render(){renderDashboard();renderStudents();renderGroups();renderAttendance();renderReports();}
function renderDashboard(){
  const current=today();const todayRecords=data.records.filter(row=>row.date===current);
  const present=todayRecords.filter(row=>row.status==='Presente').length;
  $('#today-heading').textContent=`Resumen del día · ${new Intl.DateTimeFormat('es-MX',{dateStyle:'long'}).format(new Date())}`;
  $('#stat-students').textContent=data.students.length;
  $('#stat-present').textContent=present;
  $('#stat-absent').textContent=todayRecords.length-present;
  $('#stat-percent').textContent=todayRecords.length?`${Math.round(100*present/todayRecords.length)} %`:'0 %';
  const body=$('#recent-body');body.replaceChildren();
  const latest=[...data.records].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);
  for(const record of latest){const row=body.insertRow();for(const value of [record.studentId,record.name,record.group,record.status,formatDate(record.date)])row.append(el('td',value));}
  if(!latest.length)emptyRow(body,5,'Todavía no hay asistencias registradas.');
}
function renderStudents(){
  const term=$('#student-search').value.trim().toLocaleLowerCase('es');
  const students=data.students.filter(s=>`${s.id} ${s.name} ${s.group}`.toLocaleLowerCase('es').includes(term));
  const body=$('#students-body');body.replaceChildren();
  for(const student of students){
    const row=body.insertRow();for(const value of [student.id,student.name,student.group,'Activo'])row.append(el('td',value));
    const cell=row.insertCell();
    const edit=el('button','Editar');edit.type='button';edit.addEventListener('click',()=>openStudentDialog(student));cell.append(edit);
    const remove=el('button','Eliminar');remove.type='button';remove.addEventListener('click',()=>{
      if(!confirm(`¿Eliminar a ${student.name} y sus registros de asistencia?`))return;
      data.students=data.students.filter(s=>s.id!==student.id);data.records=data.records.filter(r=>r.studentId!==student.id);render();
    });cell.append(remove);
  }
  if(!students.length)emptyRow(body,5,'No se encontraron estudiantes.');
  $('#students-count').textContent=`Mostrando ${students.length} de ${data.students.length} estudiantes`;
}
$('#student-search').addEventListener('input',renderStudents);
function openStudentDialog(student){
  $('#student-form').reset();$('#student-error').textContent='';$('#original-id').value=student?.id||'';
  $('#dialog-title').textContent=student?'Editar estudiante':'Nuevo estudiante';
  $('#student-id').value=student?.id||'';$('#student-name').value=student?.name||'';$('#student-group').value=student?.group||'';
  $('#student-dialog').showModal();$('#student-id').focus();
}
$('#add-student').addEventListener('click',()=>openStudentDialog());
$('#cancel-dialog').addEventListener('click',()=>$('#student-dialog').close());
$('#student-form').addEventListener('submit',event=>{
  event.preventDefault();const oldId=$('#original-id').value;
  const student={id:$('#student-id').value.trim(),name:$('#student-name').value.trim(),group:$('#student-group').value.trim()};
  if(!student.id||!student.name||!student.group)return;
  if(data.students.some(s=>s.id===student.id&&s.id!==oldId)){$('#student-error').textContent='Esa matrícula ya existe.';return;}
  if(oldId){data.students=data.students.map(s=>s.id===oldId?student:s);data.records=data.records.map(r=>r.studentId===oldId?{...r,studentId:student.id,name:student.name,group:student.group}:r);}
  else data.students.push(student);
  data.students.sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}));$('#student-dialog').close();render();
});

function setOptions(selector,items,all){const select=$(selector);const value=select.value;select.replaceChildren();if(all){const option=el('option','Todos');option.value='';select.append(option);}for(const item of items){const option=el('option',item);option.value=item;select.append(option);}if([...select.options].some(o=>o.value===value))select.value=value;}
function renderGroups(){const groups=[...new Set(data.students.map(s=>s.group))].sort();setOptions('#attendance-group',groups,false);setOptions('#report-group',groups,true);}
function renderAttendance(){
  const date=$('#attendance-date').value;const group=$('#attendance-group').value;
  const students=data.students.filter(s=>s.group===group);const body=$('#attendance-body');body.replaceChildren();
  for(const student of students){
    const previous=data.records.find(r=>r.date===date&&r.studentId===student.id);
    const row=body.insertRow();row.append(el('td',student.id),el('td',student.name));
    for(const status of ['Presente','Ausente']){
      const cell=row.insertCell();const radio=document.createElement('input');radio.type='radio';radio.name=`attendance-${student.id}`;radio.value=status;radio.checked=previous?.status===status;radio.setAttribute('aria-label',`${student.name}: ${status}`);radio.addEventListener('change',updateAttendanceSummary);cell.append(radio);
    }
  }
  if(!students.length)emptyRow(body,4,'Agrega estudiantes para este grupo.');
  updateAttendanceSummary();
}
function updateAttendanceSummary(){const selected=[...$('#attendance-body').querySelectorAll('input:checked')];$('#attendance-summary').textContent=`Resumen: ${selected.filter(x=>x.value==='Presente').length} presentes · ${selected.filter(x=>x.value==='Ausente').length} ausentes`;}
$('#attendance-date').value=today();
$('#attendance-date').addEventListener('change',renderAttendance);
$('#attendance-group').addEventListener('change',renderAttendance);
$('#save-attendance').addEventListener('click',()=>{
  const date=$('#attendance-date').value,group=$('#attendance-group').value;
  if(!date||!group){$('#save-status').textContent='Selecciona una fecha y un grupo.';return;}
  const students=data.students.filter(s=>s.group===group);
  if(!students.length){$('#save-status').textContent='No hay estudiantes en el grupo.';return;}
  const chosen=students.map(s=>({student:s,radio:document.querySelector(`input[name="attendance-${CSS.escape(s.id)}"]:checked`)}));
  if(chosen.some(item=>!item.radio)){$('#save-status').textContent='Marca Presente o Ausente para todos los estudiantes.';return;}
  const ids=new Set(students.map(s=>s.id));data.records=data.records.filter(r=>!(r.date===date&&ids.has(r.studentId)));
  for(const {student,radio} of chosen)data.records.push({date,studentId:student.id,name:student.name,group:student.group,status:radio.value});
  $('#save-status').textContent='Registro aplicado en esta demostración. Se borrará al recargar la página.';renderDashboard();renderReports();
});

function filteredReports(){const group=$('#report-group').value,start=$('#report-start').value,end=$('#report-end').value;return data.records.filter(r=>(!group||r.group===group)&&(!start||r.date>=start)&&(!end||r.date<=end)).sort((a,b)=>b.date.localeCompare(a.date)||a.name.localeCompare(b.name));}
function renderReports(){const records=filteredReports(),present=records.filter(r=>r.status==='Presente').length;$('#report-percent').textContent=records.length?`${Math.round(100*present/records.length)} %`:'0 %';$('#report-summary').textContent=`Asistencias: ${present} · Inasistencias: ${records.length-present}`;
  const body=$('#report-body');body.replaceChildren();for(const record of records){const row=body.insertRow();for(const value of [formatDate(record.date),record.name,record.group,record.status])row.append(el('td',value));}if(!records.length)emptyRow(body,4,'No hay registros para los filtros seleccionados.');
}
for(const selector of ['#report-group','#report-start','#report-end'])$(selector).addEventListener('change',renderReports);
$('#export-csv').addEventListener('click',()=>{
  const rows=[['Fecha','Matrícula','Estudiante','Grupo','Estado'],...filteredReports().map(r=>[r.date,r.studentId,r.name,r.group,r.status])];
  const csv='\uFEFF'+rows.map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download='reporte_asistencias.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
render();
