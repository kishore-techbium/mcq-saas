
const styles = {

  /* ================= PAGE ================= */

  page:{
    minHeight:'100vh',
    background:'#f5f7fb',
    padding:'30px',
    fontFamily:'Arial, Helvetica, sans-serif'
  },

  /* ================= HEADER ================= */

  header:{
    display:'flex',
    justifyContent:'space-between',
    alignItems:'center',
    marginBottom:'25px'
  },

  titleSection:{},

  title:{
    margin:0,
    fontSize:'32px',
    fontWeight:'700',
    color:'#1e293b'
  },

  subtitle:{
    marginTop:'8px',
    color:'#64748b',
    fontSize:'15px'
  },

  rightHeader:{
    display:'flex',
    gap:'12px',
    alignItems:'center'
  },

  inputSmall:{
    padding:'10px 12px',
    border:'1px solid #d1d5db',
    borderRadius:'8px',
    background:'#fff',
    fontSize:'14px',
    minWidth:'120px'
  },

  select:{
    padding:'10px 12px',
    border:'1px solid #d1d5db',
    borderRadius:'8px',
    background:'#fff',
    fontSize:'14px',
    cursor:'pointer'
  },

  /* ================= LAYOUT ================= */

  container:{
    display:'grid',
    gridTemplateColumns:'1fr 1fr',
    gap:'25px',
    alignItems:'start'
  },

  left:{},

  right:{
    position:'sticky',
    top:'20px'
  },

  /* ================= CARD ================= */

  card:{
    background:'#fff',
    borderRadius:'14px',
    padding:'22px',
    border:'1px solid #e5e7eb',
    boxShadow:'0 4px 20px rgba(0,0,0,.05)',
    marginBottom:'20px'
  },

  cardTitle:{
    margin:'0 0 18px 0',
    fontSize:'20px',
    fontWeight:'700',
    color:'#111827'
  },

  /* ================= OCR ================= */

  dropZone:{
    border:'2px dashed #2563eb',
    borderRadius:'12px',
    padding:'35px',
    textAlign:'center',
    background:'#f8fbff',
    cursor:'pointer',
    transition:'0.25s'
  },

  uploadIcon:{
    fontSize:'46px',
    marginBottom:'10px'
  },

  uploadTitle:{
    fontWeight:'700',
    fontSize:'18px',
    marginBottom:'8px'
  },

  uploadText:{
    color:'#6b7280',
    lineHeight:'1.7'
  },

  browseBtn:{
    marginTop:'18px',
    padding:'10px 18px',
    border:'none',
    borderRadius:'8px',
    background:'#2563eb',
    color:'#fff',
    cursor:'pointer',
    fontWeight:'600'
  },

  progress:{
    marginTop:'18px',
    color:'#2563eb',
    fontWeight:'600'
  },

  imagePreview:{
    marginTop:'20px',
    width:'100%',
    borderRadius:'10px',
    border:'1px solid #ddd'
  },

  /* ================= TEXTAREA ================= */

  textarea:{
    width:'100%',
    minHeight:'260px',
    border:'1px solid #d1d5db',
    borderRadius:'10px',
    padding:'16px',
    fontSize:'16px',
    resize:'vertical',
    lineHeight:'1.9',
    fontFamily:'Consolas, monospace',
    boxSizing:'border-box',
    outline:'none'
  },

  /* ================= PREVIEW ================= */

  preview:{
    background:'#fff',
    borderRadius:'14px',
    border:'1px solid #e5e7eb',
    padding:'25px',
    minHeight:'700px',
    boxShadow:'0 4px 20px rgba(0,0,0,.05)'
  },

  previewTitle:{
    fontSize:'22px',
    fontWeight:'700',
    marginBottom:'20px',
    color:'#111827'
  },

  question:{
    fontSize:'18px',
    lineHeight:'2',
    color:'#111827',
    whiteSpace:'pre-wrap'
  },

  option:{
    padding:'14px 16px',
    border:'1px solid #e5e7eb',
    borderRadius:'8px',
    marginTop:'12px',
    fontSize:'17px'
  },

  explanation:{
    marginTop:'20px',
    padding:'18px',
    background:'#f9fafb',
    borderRadius:'10px',
    lineHeight:'1.9'
  },

  /* ================= BUTTON ================= */

  primaryBtn:{
    padding:'12px 22px',
    background:'#2563eb',
    color:'#fff',
    border:'none',
    borderRadius:'8px',
    cursor:'pointer',
    fontWeight:'600'
  },

  secondaryBtn:{
    padding:'12px 22px',
    background:'#fff',
    color:'#2563eb',
    border:'1px solid #2563eb',
    borderRadius:'8px',
    cursor:'pointer',
    fontWeight:'600'
  }

}

export default styles
