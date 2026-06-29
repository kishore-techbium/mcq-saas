const styles = {
searchInput:{

    width:"100%",

    padding:"12px",

    border:"1px solid #d1d5db",

    borderRadius:10,

    fontSize:15,

    boxSizing:"border-box",

    outline:"none"

},

insertGrid:{

    display:"grid",

    gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",

    gap:12

},

insertItem:{

    border:"1px solid #e5e7eb",

    background:"#fff",

    borderRadius:10,

    padding:12,

    cursor:"pointer",

    textAlign:"left",

    transition:"0.2s"

},

insertItemLabel:{

    fontWeight:600,

    marginBottom:8,

    color:"#111827"

},

insertItemValue:{

    color:"#2563eb",

    fontSize:14,

    wordBreak:"break-word"

},
previewContainer:{
    display:"flex",
    flexDirection:"column",
    gap:24
},

previewQuestion:{
    fontSize:18,
    lineHeight:1.8,
    color:"#111827",
    whiteSpace:"pre-wrap"
},

previewOptions:{
    display:"flex",
    flexDirection:"column",
    gap:14
},

previewOption:{
    display:"flex",
    gap:14,
    alignItems:"flex-start",
    padding:"10px 0",
    borderBottom:"1px solid #f1f1f1"
},

previewOptionLabel:{
    width:28,
    fontWeight:600,
    color:"#2563eb",
    flexShrink:0
},

previewOptionText:{
    flex:1,
    lineHeight:1.7,
    whiteSpace:"pre-wrap"
},
optionRow:{
    display:"flex",
    gap:12,
    alignItems:"flex-start"
},

optionLabel:{
    width:40,
    height:40,
    borderRadius:20,
    background:"#2563eb",
    color:"#fff",
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    fontWeight:600,
    flexShrink:0,
    marginTop:4
},

optionTextarea:{
    flex:1,
    minHeight:70,
    resize:"vertical",
    border:"1px solid #d1d5db",
    borderRadius:10,
    padding:12,
    fontSize:15,
    fontFamily:"inherit",
    boxSizing:"border-box"
},

deleteOptionButton:{
    width:36,
    height:36,
    border:"1px solid #d1d5db",
    background:"#fff",
    borderRadius:8,
    cursor:"pointer",
    fontSize:16,
    flexShrink:0
},

emptyState:{
    padding:20,
    border:"1px dashed #d1d5db",
    borderRadius:10,
    textAlign:"center",
    color:"#6b7280",
    background:"#fafafa"
},
toolbar: {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 12px',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  background: '#fafafa',
  flexWrap: 'wrap'
},

toolbarButton: {
  border: '1px solid #d1d5db',
  background: '#ffffff',
  borderRadius: 8,
  padding: '8px 12px',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 500,
  minWidth: 42,
  transition: 'all 0.2s ease'
},

toolbarDivider: {
  width: 1,
  alignSelf: 'stretch',
  background: '#d1d5db',
  margin: '0 6px'
},
editorFooter: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: 13,
  color: '#6b7280',
  borderTop: '1px solid #ececec',
  paddingTop: 12
},
cardHeader: {
  padding: '16px 20px',
  borderBottom: '1px solid #ececec',
  background: '#fafafa',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
},

cardHeaderLeft: {
  display: 'flex',
  flexDirection: 'column',
  gap: 4
},

cardTitle: {
  fontSize: 16,
  fontWeight: 600,
  color: '#111827'
},

cardSubtitle: {
  fontSize: 13,
  color: '#6b7280'
},

cardActions: {
  display: 'flex',
  gap: 8,
  alignItems: 'center'
},
  /* ===========================
     PAGE
  =========================== */

  page: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#f5f7fb'
  },

  container: {
    flex: 1,
    display: 'flex',
    gap: 20,
    padding: 20,
    overflow: 'hidden'
  },

  left: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    overflowY: 'auto',
    paddingRight: 6
  },

  right: {
    width: '45%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },

  /* ===========================
     CARD
  =========================== */

  card: {
    background: '#ffffff',
    borderRadius: 14,
    border: '1px solid #e5e7eb',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    overflow: 'hidden'
  },

  cardHeader: {
    padding: '14px 18px',
    fontSize: 16,
    fontWeight: 600,
    borderBottom: '1px solid #ececec',
    background: '#fafafa'
  },

  cardBody: {
    padding: 18,
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },

  /* ===========================
     TEXT
  =========================== */

  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#374151'
  },

  helperText: {
    fontSize: 13,
    color: '#6b7280'
  },

  /* ===========================
     BUTTONS
  =========================== */

  primaryButton: {
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 18px',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500
  },

  secondaryButton: {
    background: '#fff',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    padding: '10px 18px',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500
  },

  buttonRow: {
    display: 'flex',
    gap: 12
  },

  /* ===========================
     INPUTS
  =========================== */

  editorTextarea: {
    width: '100%',
    minHeight: 220,
    resize: 'vertical',
    border: '1px solid #d1d5db',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    lineHeight: 1.6,
    outline: 'none',
    fontFamily: 'inherit',
    background: '#fff',
    boxSizing: 'border-box'
  },

  input: {
    width: '100%',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 14,
    outline: 'none'
  },

  /* ===========================
     IMAGE
  =========================== */

  previewImage: {
    width: '100%',
    maxHeight: 350,
    objectFit: 'contain',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    background: '#fafafa'
  },

  /* ===========================
     PROGRESS
  =========================== */

  progressBox: {
    background: '#eef4ff',
    border: '1px solid #bfd6ff',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    color: '#1d4ed8'
  }

}

export default styles
