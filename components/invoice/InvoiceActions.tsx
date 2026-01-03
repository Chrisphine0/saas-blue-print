"use client"

import { Button } from "@/components/ui/button"
import { Download, Printer } from "lucide-react"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

interface Props {
  invoiceNumber: string
}

export function InvoiceActions({ invoiceNumber }: Props) {
  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    const invoiceElement = document.getElementById("invoice-card")
    if (!invoiceElement) return

    // Temporarily hide elements with 'data-no-export' during capture
    const canvas = await html2canvas(invoiceElement, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
    })
    
    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [canvas.width, canvas.height],
    })

    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height)
    pdf.save(`Invoice_${invoiceNumber}.pdf`)
  }

  return (
    <div className="grid gap-2">
      <Button 
        variant="outline" 
        className="w-full justify-start" 
        onClick={handleDownloadPDF}
      >
        <Download className="mr-2 h-4 w-4" /> Download PDF
      </Button>
      <Button 
        variant="outline" 
        className="w-full justify-start" 
        onClick={handlePrint}
      >
        <Printer className="mr-2 h-4 w-4" /> Print Invoice
      </Button>
    </div>
  )
}